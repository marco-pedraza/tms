import { useParams } from 'next/navigation';
import { Params } from 'next/dist/server/request/params';
import isNumber from '@/utils/is-number';

interface CountryPageParams extends Params {
  id: string;
}

export default function useCountryDetailsParams() {
  const params = useParams<CountryPageParams>();
  const idParam = params?.id || '';
  const countryId = Number.parseInt(idParam, 10);
  const isValidId = isNumber(idParam);

  return {
    countryId,
    isValidId,
  };
}
