import { redirect } from "next/navigation";

type Params = { city: string; service: string };

export default async function ServicesInCityServiceRedirect({
  params,
}: {
  params: Promise<Params>;
}) {
  const { city, service } = await params;
  redirect(`/${city}/${service}`);
}
