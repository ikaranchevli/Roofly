import { FileText } from 'lucide-react';
import * as Icons from 'lucide-react';

export const availableIcons = [
  'Zap', 'Droplet', 'Wifi', 'Flame', 'Home', 'Tool', 'Trash', 'Wrench', 
  'Shield', 'Wind', 'Sun', 'CreditCard', 'FileText', 'Tv', 'Briefcase',
] as const;

export type IconName = typeof availableIcons[number];

export function DynamicIcon({ name, className }: { name?: string | null; className?: string }) {
  if (!name) return <FileText className={className} />;
  
  // @ts-ignore - dynamic index signature
  const IconComponent = Icons[name];
  
  return IconComponent ? <IconComponent className={className} /> : <FileText className={className} />;
}
