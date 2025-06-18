import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function pluralize(count: number, singular: string, plural?: string) {
	return count === 1 ? singular : (plural ?? `${singular}s`);
}

export const TYPES_SUBTYPES = {
	project: "email",
	email: "version",
};

export function deleteConfirmationMessage({
	name,
	count = 0,
	type,
}: {
	name: string;
	count?: number;
	type: keyof typeof TYPES_SUBTYPES;
}) {
	count = count ?? 0;
	return `Delete the "${name}" ${type}${
		count ? ` and its ${count} ${pluralize(count, TYPES_SUBTYPES[type])}` : ""
	}? This action is irreversible.\n\nAre you sure you want to continue?`;
}

type GenericDataType = {
	id: string;
	name: string;
	count?: number;
	type: keyof typeof TYPES_SUBTYPES;
};

export function confirmDeletion<DataType extends GenericDataType>(
	data: DataType,
	deleteMutation: (data: DataType) => void,
) {
	if (!window.confirm(deleteConfirmationMessage(data))) return;
	let name: string | null = "";
	while (true) {
		name = window.prompt(`Type "${data.name}" to confirm project deletion`);
		if (name === null) return;
		if (name === data.name) {
			deleteMutation(data);
			return;
		}
	}
}
