import { readEml } from 'eml-parse-js';
import { DropPasteIcons, DropPasteInput } from './drop-paste.model';
import { Log } from '../log';

export interface EmlTaskData {
  title: string;
  attachment: DropPasteInput;
}

// eml-parse-js does not re-export its result interfaces, so we type the
// fields we read structurally
interface EmailAddressLike {
  name?: string;
  email?: string;
}

interface ReadEmlResultLike {
  subject?: string;
  from?: string | EmailAddressLike | EmailAddressLike[] | null;
}

export const isEmlFile = (file: File): boolean =>
  file.type === 'message/rfc822' || /\.eml$/i.test(file.name);

export const emlToTaskTitle = (
  parsed: ReadEmlResultLike,
  fallbackTitle: string,
): string => {
  const fromRaw = Array.isArray(parsed.from) ? parsed.from[0] : parsed.from;
  const sender = typeof fromRaw === 'string' ? fromRaw : fromRaw?.name || fromRaw?.email;
  const subject = parsed.subject?.trim() || fallbackTitle;
  return sender ? `${sender}: ${subject}` : subject;
};

export const createTaskDataFromEml = async (file: File): Promise<EmlTaskData> => {
  const fallbackTitle = file.name.replace(/\.eml$/i, '');
  const attachment: DropPasteInput = {
    title: fallbackTitle,
    // .path only exists in the electron renderer; web builds get the name only
    path: (file as File & { path?: string }).path || file.name,
    type: 'FILE',
    icon: DropPasteIcons.FILE,
  };

  let parsed: unknown;
  try {
    // returns Error or string on failure rather than throwing
    parsed = readEml(await file.text());
  } catch (e) {
    Log.err(e);
    parsed = null;
  }

  if (!parsed || typeof parsed !== 'object' || parsed instanceof Error) {
    return { title: fallbackTitle, attachment };
  }

  return {
    title: emlToTaskTitle(parsed as ReadEmlResultLike, fallbackTitle),
    attachment,
  };
};
