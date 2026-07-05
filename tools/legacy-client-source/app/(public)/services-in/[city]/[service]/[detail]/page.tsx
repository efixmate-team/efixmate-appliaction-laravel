import { redirect } from "next/navigation";

type Params = { city: string; service: string; detail: string };

export default async function ServicesInAreaServiceRedirect({
  params,
}: {
  params: Promise<Params>;
}) {
  const { city, service: area, detail: service } = await params;
  redirect(`/${city}/${area}/${service}`);
}
