export const categories = [
  "Vías y calles",
  "Alumbrado público",
  "Agua y drenajes",
  "Limpieza y residuos",
  "Espacios públicos",
  "Otros",
] as const;
export const statuses = [
  "Recibido",
  "En revisión",
  "En proceso",
  "Resuelto",
] as const;
export type Report = {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  location: string;
  name: string;
  email: string;
  ownerUid: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  hasPhoto: boolean;
};
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function validateReport(raw: Record<string, unknown>) {
  const string = (key: string, min: number, max: number) => {
    if (typeof raw[key] !== "string")
      throw new ApiError(400, `El campo ${key} no es válido.`);
    const value = (raw[key] as string).trim();
    if (value.length < min || value.length > max)
      throw new ApiError(
        400,
        `Revisa el campo ${key}: debe tener entre ${min} y ${max} caracteres.`,
      );
    return value;
  };
  const title = string("title", 5, 120),
    description = string("description", 20, 3000),
    location = string("location", 5, 250);
  const name = string("name", 0, 100),
    email = string("email", 0, 150),
    category = string("category", 1, 60),
    id = string("id", 36, 36);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
  )
    throw new ApiError(400, "El identificador del reporte no es válido.");
  if (!(categories as readonly string[]).includes(category))
    throw new ApiError(400, "Selecciona una categoría válida.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new ApiError(400, "El correo electrónico no es válido.");
  const photo = string("photo", 30, 460000);
  if (!/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/=]+$/.test(photo))
    throw new ApiError(400, "Adjunta una fotografía JPEG válida.");
  return { id, title, description, location, name, email, category, photo };
}
export function encodeFields(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      typeof value === "boolean"
        ? { booleanValue: value }
        : { stringValue: String(value) },
    ]),
  );
}
export function decodeFields(doc: {
  fields?: Record<string, { stringValue?: string; booleanValue?: boolean }>;
}) {
  return Object.fromEntries(
    Object.entries(doc.fields || {}).map(([key, value]) => [
      key,
      value.stringValue ?? value.booleanValue,
    ]),
  );
}
