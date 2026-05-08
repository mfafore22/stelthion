import { redirect } from 'next/navigation';

export default function MallLoginRedirect() {
  redirect('/login');
}
