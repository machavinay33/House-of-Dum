-- =============================================================================
-- House of Dum - seed data
-- Source: the official House of Dum menu PDF (names and prices copied exactly).
-- Descriptions were not printed on the menu, so they are left empty on purpose.
-- Add them, or correct anything, from /admin -> Menu.
--
-- Safe to run more than once: it does nothing if categories already exist.
-- Run AFTER all files in supabase/migrations.
-- =============================================================================

do $seed$
begin
  if exists (select 1 from public.menu_categories) then
    raise notice 'Menu already has data - seed skipped.';
    return;
  end if;

  -- ---------- Categories (order as printed on the menu) ----------
  insert into public.menu_categories (name, sort_order) values
    ('Authentic Hyderabadi Dum Biryani', 10),
    ('Shahi Hyderabadi Dum Biryani',     20),
    ('Tandoori Tikka & Kebabs',          30),
    ('HOD Fried Chicken & Fries',        40),
    ('Chinese Starters',                 50),
    ('Sides, Desserts & Beverages',      60),
    ('Combos',                           70);

  -- ---------- Items ----------
  -- is_veg: true = vegetarian, false = non-vegetarian (decided from the dish name).
  -- is_featured marks the items highlighted on the home page; change from the admin panel.
  insert into public.menu_items (category_id, name, price, is_veg, is_featured, sort_order)
  select c.id, v.name, v.price, v.is_veg, v.is_featured, v.sort_order
  from (values
    -- Authentic Hyderabadi Dum Biryani
    ('Authentic Hyderabadi Dum Biryani', 'Hyderabadi Chicken Dum Biryani',   279, false, true,  10),
    ('Authentic Hyderabadi Dum Biryani', 'Hyderabadi Mutton Dum Biryani',    299, false, true,  20),
    ('Authentic Hyderabadi Dum Biryani', 'Nawabi Paneer Dum Biryani',        239, true,  true,  30),
    ('Authentic Hyderabadi Dum Biryani', 'Hyderabadi Egg Dum Biryani',       249, false, false, 40),
    ('Authentic Hyderabadi Dum Biryani', 'Subz-E-Hyderabad Dum Biryani',     229, true,  false, 50),
    -- Shahi Hyderabadi Dum Biryani
    ('Shahi Hyderabadi Dum Biryani', 'Dumdar Murgh Tikka Biryani',           395, false, true,  10),
    ('Shahi Hyderabadi Dum Biryani', 'Zaikedaar Paneer Tikka Biryani',       375, true,  false, 20),
    ('Shahi Hyderabadi Dum Biryani', 'Dil Khush Boneless Chicken Dum Biryani', 375, false, false, 30),
    ('Shahi Hyderabadi Dum Biryani', 'Lazeez Chicken Tandoori Biryani',      385, false, true,  40),
    -- Tandoori Tikka & Kebabs (chicken items have 4 / 8 piece variants, price = 4 pieces)
    ('Tandoori Tikka & Kebabs', 'Tandoori Chicken',         299, false, true,  10),
    ('Tandoori Tikka & Kebabs', 'Afgani Tandoori Chicken',  349, false, false, 20),
    ('Tandoori Tikka & Kebabs', 'Chicken Angara Tikka',     169, false, false, 30),
    ('Tandoori Tikka & Kebabs', 'Chicken Aachari Tikka',    169, false, false, 40),
    ('Tandoori Tikka & Kebabs', 'Chicken Garlic Tikka',     169, false, false, 50),
    ('Tandoori Tikka & Kebabs', 'Chicken Kalimiri Tikka',   169, false, false, 60),
    ('Tandoori Tikka & Kebabs', 'Chicken Tikka Kebab',      169, false, true,  70),
    ('Tandoori Tikka & Kebabs', 'Chicken Hariyali Tikka',   169, false, false, 80),
    ('Tandoori Tikka & Kebabs', 'Paneer Hariyali Tikka',    289, true,  false, 90),
    ('Tandoori Tikka & Kebabs', 'Paneer Kalimiri Tikka',    289, true,  false, 100),
    ('Tandoori Tikka & Kebabs', 'Paneer Tikka Kebab',       289, true,  false, 110),
    -- HOD Fried Chicken & Fries
    ('HOD Fried Chicken & Fries', 'Chicken Popcorn',        249, false, false, 10),
    ('HOD Fried Chicken & Fries', 'Crispy Chicken Strips',  249, false, false, 20),
    ('HOD Fried Chicken & Fries', 'Peri Peri Fries',        199, true,  false, 30),
    ('HOD Fried Chicken & Fries', 'French Fries',           149, true,  false, 40),
    -- Chinese Starters
    ('Chinese Starters', 'Chilli Chicken',    289, false, false, 10),
    ('Chinese Starters', 'Garlic Chicken',    289, false, false, 20),
    ('Chinese Starters', 'Chicken 65',        289, false, true,  30),
    ('Chinese Starters', 'Chicken Lollipop',  299, false, false, 40),
    ('Chinese Starters', 'Chilli Paneer',     269, true,  false, 50),
    ('Chinese Starters', 'Chicken Pakoda',    289, false, false, 60),
    ('Chinese Starters', 'Garlic Paneer',     269, true,  false, 70),
    -- Sides, Desserts & Beverages
    ('Sides, Desserts & Beverages', 'Diet Coke',        59,  true, false, 10),
    ('Sides, Desserts & Beverages', 'Red Bull',         149, true, false, 20),
    ('Sides, Desserts & Beverages', 'Butter Milk',      29,  true, false, 30),
    ('Sides, Desserts & Beverages', 'Cold Drink',       29,  true, false, 40),
    ('Sides, Desserts & Beverages', 'Fresh Lime Soda',  99,  true, false, 50),
    ('Sides, Desserts & Beverages', 'Masala Lemonade',  99,  true, false, 60),
    -- Combos
    ('Combos', 'Mutton Biryani + Chicken Tikka + Chicken Garlic Tikka + Chicken Angara Tikka (4 Pieces)',  449, false, false, 10),
    ('Combos', 'Chicken Biryani + Chicken Tikka + Chicken Garlic Tikka + Chicken Angara Tikka (4 Pieces)', 399, false, false, 20),
    ('Combos', 'Chicken Biryani + Chicken Popcorn',                    429, false, false, 30),
    ('Combos', 'Shahi Chicken Kheema Masala + 2 Malabar Paratha',      349, false, false, 40),
    ('Combos', 'Shahi Mutton Kheema Masala + 2 Malabar Paratha',       449, false, false, 50),
    ('Combos', 'Shahi Bhuna Mutton Masala + 2 Malabar Paratha',        449, false, false, 60),
    ('Combos', 'Shahi Bhuna Chicken Masala + 2 Malabar Paratha',       349, false, false, 70)
  ) as v(category, name, price, is_veg, is_featured, sort_order)
  join public.menu_categories c on c.name = v.category;

  -- ---------- Variants (4 Pieces / 8 Pieces) ----------
  insert into public.menu_item_variants (item_id, label, price, sort_order)
  select i.id, v.label, v.price, v.sort_order
  from (values
    ('Tandoori Chicken',        '4 Pieces', 299, 10), ('Tandoori Chicken',        '8 Pieces', 549, 20),
    ('Afgani Tandoori Chicken', '4 Pieces', 349, 10), ('Afgani Tandoori Chicken', '8 Pieces', 599, 20),
    ('Chicken Angara Tikka',    '4 Pieces', 169, 10), ('Chicken Angara Tikka',    '8 Pieces', 329, 20),
    ('Chicken Aachari Tikka',   '4 Pieces', 169, 10), ('Chicken Aachari Tikka',   '8 Pieces', 329, 20),
    ('Chicken Garlic Tikka',    '4 Pieces', 169, 10), ('Chicken Garlic Tikka',    '8 Pieces', 329, 20),
    ('Chicken Kalimiri Tikka',  '4 Pieces', 169, 10), ('Chicken Kalimiri Tikka',  '8 Pieces', 329, 20),
    ('Chicken Tikka Kebab',     '4 Pieces', 169, 10), ('Chicken Tikka Kebab',     '8 Pieces', 329, 20),
    ('Chicken Hariyali Tikka',  '4 Pieces', 169, 10), ('Chicken Hariyali Tikka',  '8 Pieces', 329, 20)
  ) as v(item, label, price, sort_order)
  join public.menu_items i on i.name = v.item;

  raise notice 'Seeded % categories and % items.',
    (select count(*) from public.menu_categories),
    (select count(*) from public.menu_items);
end
$seed$;

-- ---------- Restaurant settings (from the "Business details" on the menu) ----------
-- WhatsApp, Instagram and opening hours were not on the menu: fill them in from /admin -> Settings.
insert into public.restaurant_settings
  (name, tagline, phone, address, branches, description)
values (
  'House of Dum',
  'Hyderabadi Dum Biryani & Kababs',
  '+91 9209383121',
  'Shop No. 1, Meghdoot Height, Besides Pizza Hut, South Ambazari Road, Shraddhanand Peth, Nagpur',
  'Laxmi Nagar | MIHAN',
  'House of Dum serves Hyderabadi dum biryani, tandoori tikkas and kababs in Nagpur. Browse the menu, add your favourites to the cart and order online for delivery.'
)
on conflict (singleton) do nothing;
