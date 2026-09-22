-- =============================================================================
-- Functions: admin check, order codes, place_order, track_order
-- =============================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Human-readable, unambiguous code such as HOD-7K4P92 (no 0/O/1/I/L).
-- Uses gen_random_uuid() as a cryptographically strong random source.
create or replace function public.generate_order_code()
returns text
language plpgsql
volatile
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';  -- 31 characters
  raw bytea := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
  code text := '';
  i integer;
begin
  -- bytes 0..5 of a v4 uuid are fully random
  for i in 0..5 loop
    code := code || substr(alphabet, (get_byte(raw, i) % 31) + 1, 1);
  end loop;
  return 'HOD-' || code;
end;
$$;

-- -----------------------------------------------------------------------------
-- place_order: the ONLY way customers create orders.
-- Prices, names and availability are read from the database. Any price sent by
-- the browser is ignored (the browser does not even send one).
-- p_items: [{ "item_id": uuid, "variant_id": uuid|null, "quantity": 1..20 }, ...]
-- -----------------------------------------------------------------------------
create or replace function public.place_order(
  p_customer_name text,
  p_phone         text,
  p_address       text,
  p_landmark      text,
  p_instructions  text,
  p_items         jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name          text := btrim(coalesce(p_customer_name, ''));
  v_digits        text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_phone         text;
  v_address       text := btrim(coalesce(p_address, ''));
  v_landmark      text := btrim(coalesce(p_landmark, ''));
  v_instructions  text := nullif(btrim(coalesce(p_instructions, '')), '');
  v_line          jsonb;
  v_item          public.menu_items%rowtype;
  v_variant       public.menu_item_variants%rowtype;
  v_item_id       uuid;
  v_variant_id    uuid;
  v_qty           integer;
  v_unit          numeric(10,2);
  v_label         text;
  v_has_variants  boolean;
  v_total         numeric(10,2) := 0;
  v_lines         jsonb := '[]'::jsonb;
  v_order_id      uuid;
  v_code          text;
  v_attempts      integer := 0;
begin
  -- ---- customer details ----
  if char_length(v_name) < 2 or char_length(v_name) > 100 then
    raise exception 'Please enter your full name.';
  end if;

  if char_length(v_digits) = 12 and left(v_digits, 2) = '91' then
    v_digits := substr(v_digits, 3);
  elsif char_length(v_digits) = 11 and left(v_digits, 1) = '0' then
    v_digits := substr(v_digits, 2);
  end if;
  if v_digits !~ '^[6-9][0-9]{9}$' then
    raise exception 'Please enter a valid 10-digit mobile number.';
  end if;
  v_phone := '+91' || v_digits;

  if char_length(v_address) < 10 or char_length(v_address) > 500 then
    raise exception 'Please enter your full delivery address (at least 10 characters).';
  end if;
  if char_length(v_landmark) < 2 or char_length(v_landmark) > 150 then
    raise exception 'Please enter a landmark near your address.';
  end if;
  if v_instructions is not null and char_length(v_instructions) > 300 then
    raise exception 'Delivery instructions can be at most 300 characters.';
  end if;

  -- ---- cart ----
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;
  if jsonb_array_length(p_items) > 40 then
    raise exception 'Your cart has too many items. Please split it into two orders.';
  end if;

  for v_line in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(v_line) <> 'object' then
      raise exception 'Invalid cart data. Please refresh the page and try again.';
    end if;

    begin
      v_item_id    := (v_line ->> 'item_id')::uuid;
      v_variant_id := nullif(v_line ->> 'variant_id', '')::uuid;
      v_qty        := (v_line ->> 'quantity')::integer;
    exception when others then
      raise exception 'Invalid cart data. Please refresh the page and try again.';
    end;

    if v_qty is null or v_qty < 1 or v_qty > 20 then
      raise exception 'Quantity must be between 1 and 20 for each item.';
    end if;

    select * into v_item from public.menu_items where id = v_item_id;
    if not found then
      raise exception 'An item in your cart is no longer on the menu. Please review your cart.';
    end if;
    if not v_item.is_available then
      raise exception '% is currently unavailable. Please remove it from your cart.', v_item.name;
    end if;

    select exists (select 1 from public.menu_item_variants where item_id = v_item.id)
      into v_has_variants;

    if v_has_variants then
      if v_variant_id is null then
        raise exception 'Please choose an option for %.', v_item.name;
      end if;
      select * into v_variant
        from public.menu_item_variants
        where id = v_variant_id and item_id = v_item.id;
      if not found then
        raise exception 'The option you chose for % is no longer available. Please review your cart.', v_item.name;
      end if;
      if not v_variant.is_available then
        raise exception '% (%) is currently unavailable. Please remove it from your cart.', v_item.name, v_variant.label;
      end if;
      v_unit  := v_variant.price;
      v_label := v_variant.label;
    else
      v_unit       := v_item.price;
      v_label      := null;
      v_variant_id := null;
    end if;

    if v_unit <= 0 then
      raise exception 'The price for % is not available right now. Please call the restaurant to order it.', v_item.name;
    end if;

    v_total := v_total + (v_unit * v_qty);
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'item_id',       v_item.id,
      'variant_id',    v_variant_id,
      'name',          v_item.name,
      'variant_label', v_label,
      'quantity',      v_qty,
      'unit_price',    v_unit,
      'line_total',    v_unit * v_qty
    ));
  end loop;

  -- ---- create order with a unique code (retry on the very unlikely collision) ----
  loop
    v_code := public.generate_order_code();
    begin
      insert into public.orders (order_code, customer_name, phone, address, landmark, instructions, total)
      values (v_code, v_name, v_phone, v_address, v_landmark, v_instructions, v_total)
      returning id into v_order_id;
      exit;
    exception when unique_violation then
      v_attempts := v_attempts + 1;
      if v_attempts > 8 then
        raise exception 'Could not create an order code. Please try again.';
      end if;
    end;
  end loop;

  insert into public.order_items
    (order_id, menu_item_id, variant_id, line_no, item_name, variant_label, unit_price, quantity, line_total)
  select
    v_order_id,
    (e.value ->> 'item_id')::uuid,
    nullif(e.value ->> 'variant_id', '')::uuid,
    e.ord::integer,
    e.value ->> 'name',
    e.value ->> 'variant_label',
    (e.value ->> 'unit_price')::numeric,
    (e.value ->> 'quantity')::integer,
    (e.value ->> 'line_total')::numeric
  from jsonb_array_elements(v_lines) with ordinality as e(value, ord);

  return jsonb_build_object(
    'order_code',    v_code,
    'status',        'received',
    'total',         v_total,
    'created_at',    now(),
    'customer_name', v_name,
    'phone',         v_phone,
    'address',       v_address,
    'landmark',      v_landmark,
    'instructions',  v_instructions,
    'items', (
      select jsonb_agg(jsonb_build_object(
        'name',          e.value ->> 'name',
        'variant_label', e.value ->> 'variant_label',
        'quantity',      (e.value ->> 'quantity')::integer,
        'unit_price',    (e.value ->> 'unit_price')::numeric,
        'line_total',    (e.value ->> 'line_total')::numeric
      ) order by e.ord)
      from jsonb_array_elements(v_lines) with ordinality as e(value, ord)
    )
  );
end;
$$;

revoke all on function public.place_order(text, text, text, text, text, jsonb) from public;
grant execute on function public.place_order(text, text, text, text, text, jsonb) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- track_order: safe, read-only lookup by order code.
-- Returns NULL when the code does not exist. Never returns ids, phone or address.
-- -----------------------------------------------------------------------------
create or replace function public.track_order(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_code   text := upper(btrim(coalesce(p_code, '')));
  v_order  public.orders%rowtype;
begin
  if v_code !~ '^HOD-[A-Z0-9]{6}$' then
    return null;
  end if;

  select * into v_order from public.orders where order_code = v_code;
  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'order_code',          v_order.order_code,
    'status',              v_order.status,
    'total',               v_order.total,
    'created_at',          v_order.created_at,
    'updated_at',          v_order.updated_at,
    'customer_first_name', split_part(v_order.customer_name, ' ', 1),
    'timeline', jsonb_build_object(
      'received',          v_order.created_at,
      'confirmed',         v_order.confirmed_at,
      'preparing',         v_order.preparing_at,
      'out_for_delivery',  v_order.out_for_delivery_at,
      'delivered',         v_order.delivered_at,
      'cancelled',         v_order.cancelled_at
    ),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name',          i.item_name,
        'variant_label', i.variant_label,
        'quantity',      i.quantity,
        'unit_price',    i.unit_price,
        'line_total',    i.line_total
      ) order by i.line_no)
      from public.order_items i
      where i.order_id = v_order.id
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.track_order(text) from public;
grant execute on function public.track_order(text) to anon, authenticated;
