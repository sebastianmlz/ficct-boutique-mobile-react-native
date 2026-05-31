// Back-compat shim: the original EmptyState now delegates to the design-system
// AppEmptyState so existing call sites get the branded look automatically.
import React from 'react';
import { AppEmptyState } from './AppEmptyState';
import type { IconName } from './AppIcon';

interface Props {
  title: string;
  subtitle?: string;
  icon?: IconName;
}

export function EmptyState({ title, subtitle, icon }: Props) {
  return <AppEmptyState title={title} subtitle={subtitle} icon={icon} />;
}

export default EmptyState;
