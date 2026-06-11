import { readEml, type ReadedEmlJson } from 'eml-parse-js';

export const getTitleAndSubject = async (
  file: File,
): Promise<{ from: string; subject: string }> => {
  const content = await file.text();
  const data = readEml(content) as ReadedEmlJson;

  return { from: String(data.from ?? ''), subject: data.subject ?? '' };
};
