import { toast as toastUtil } from '@/lib/toast';

export const toast = {
  success: (message: string) => toastUtil.success(message),
  error: (message: string) => toastUtil.error(message),
  info: (message: string) => toastUtil.info(message),
};
