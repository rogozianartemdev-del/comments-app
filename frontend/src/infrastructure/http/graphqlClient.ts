import axios from 'axios';

export async function gqlRequest<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const { data } = await axios.post('/graphql', { query, variables }, { timeout: 20000 });
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data as T;
}