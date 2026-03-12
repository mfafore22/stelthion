/**
 * Mall UI Components - Base Component Library
 *
 * Week 1 deliverables for Finnish shopping malls UI
 * All components use mall-* design tokens from Tailwind config
 */

export { MallButton, type MallButtonProps, type ButtonVariant, type ButtonSize } from './MallButton';
export { MallInput, type MallInputProps } from './MallInput';
export {
  MallCard,
  MallCardHeader,
  MallCardBody,
  MallCardFooter,
  type MallCardProps,
  type MallCardHeaderProps,
  type MallCardBodyProps,
  type MallCardFooterProps,
} from './MallCard';
export { MallBadge, type MallBadgeProps, type MallBadgeVariant } from './MallBadge';
export { MallKPICard, type MallKPICardProps, type DeltaType } from './MallKPICard';
