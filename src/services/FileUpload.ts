export async function uploadFile(
  endpoint: string,
  file: Blob | File,
  fieldName: string = "file",
) {
  const data = new FormData();
  // @ts-ignore
  data.append(fieldName, file);
  const res = await fetch(endpoint, {
    method: "POST",
    body: data,
  });
  if (!res.ok) {
    throw new Error(`Upload failed with status ${res.status}`);
  }
  return res.json();
}
