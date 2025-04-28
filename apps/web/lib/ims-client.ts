import Client from '@repo/ims-client';
import environment from '@/lib/environment';

const client = new Client(environment.NEXT_PUBLIC_IMS_API_URL);

export default client;
