import { motion } from 'framer-motion';
import type { MenuItem, MenuVariant } from '@/types';
import { cartKey, useCart } from '@/hooks/useCart';
import { QuantityStepper } from '@/components/ui/QuantityStepper';

interface Props {
  item: MenuItem;
  variant?: MenuVariant | null;
}

/** "Add" button that turns into a quantity stepper once the item is in the cart. */
export function AddControl({ item, variant = null }: Props) {
  const { getQuantity, addItem, setQuantity } = useCart();
  const variantId = variant?.id ?? null;
  const quantity = getQuantity(item.id, variantId);
  const label = variant ? `${item.name} (${variant.label})` : item.name;
  const unavailable = !item.is_available || (variant !== null && !variant.is_available);

  if (unavailable) {
    return <span className="text-sm text-mute">Unavailable</span>;
  }

  if (quantity === 0) {
    return (
      <motion.button
        type="button"
        whileTap={{ scale: 0.94 }}
        onClick={() => addItem(item, variant)}
        aria-label={`Add ${label} to cart`}
        className="btn btn-outline btn-sm min-w-[88px]"
      >
        Add
      </motion.button>
    );
  }

  return (
    <QuantityStepper
      compact
      quantity={quantity}
      label={label}
      onChange={(next) => setQuantity(cartKey(item.id, variantId), next)}
    />
  );
}
