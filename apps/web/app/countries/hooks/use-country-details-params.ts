import { useParams } from 'next/navigation';
import { Params } from 'next/dist/server/request/params';
import isNumber from '@/utils/is-number';

interface CountryPageParams extends Params {
  id: string;
}

export default function useCountryDetailsParams() {
  const params = useParams<CountryPageParams>();
  const countryId = Number.parseInt(params.id, 10);
  const isValidId = isNumber(params.id);

  return {
    countryId,
    isValidId,
  };
}
