'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function PoliciesProductTypeRedirect() {
  const router = useRouter();
  const params = useParams();
  const productType = params?.productType as string;

  useEffect(() => {
    if (productType) {
      router.replace(`/insurance-plans/${productType.toLowerCase()}`);
    } else {
      router.replace('/insurance-plans');
    }
  }, [router, productType]);

  return null;
}
