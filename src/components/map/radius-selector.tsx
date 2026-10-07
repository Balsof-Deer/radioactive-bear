import { PillGroup } from '@/components/pill-group';
import { RADIUS_OPTIONS_KM } from '@/constants/map';

type RadiusSelectorProps = {
  value: number;
  onChange: (radiusKm: number) => void;
};

const OPTIONS = RADIUS_OPTIONS_KM.map((radiusKm) => ({
  label: `${radiusKm} km`,
  value: radiusKm as number,
  accessibilityLabel: `${radiusKm} kilometres`,
}));

// Search radius as a row of pills.
export function RadiusSelector({ value, onChange }: RadiusSelectorProps) {
  return <PillGroup options={OPTIONS} value={value} onChange={onChange} accessibilityLabel="Search radius" />;
}
