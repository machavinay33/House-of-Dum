/** Standard Indian food-labelling mark: green = vegetarian, red = non-vegetarian. */
export function VegBadge({ isVeg }: { isVeg: boolean | null }) {
  if (isVeg === null) return null;
  const color = isVeg ? '#2e9d4d' : '#c0392b';
  return (
    <span
      className="mt-1.5 inline-flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[3px] border-[1.5px]"
      style={{ borderColor: color }}
      role="img"
      aria-label={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
      title={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
    >
      <span className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: color }} />
    </span>
  );
}
