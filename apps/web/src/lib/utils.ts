import { confirm, prompt } from "@/lib/dialogs";
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
	const subtype = TYPES_SUBTYPES[type];
	return `Delete the "${name}" ${type}${
		count ? ` and its ${count} ${pluralize(count, subtype)}` : ""
	}? This action is irreversible.\n\nAre you sure you want to continue?`;
}

type GenericDataType = {
	id: string;
	name: string;
	count?: number;
	type: keyof typeof TYPES_SUBTYPES;
};

export async function confirmDeletion<DataType extends GenericDataType>(
	data: DataType,
	deleteMutation: (data: DataType) => void | Promise<void>,
) {
	// First confirmation (yes/no)
	const proceed = await confirm({
		title: `Delete ${data.type}`,
		description: deleteConfirmationMessage(data),
		confirmText: "Delete",
		cancelText: "Cancel",
		variant: "destructive",
	});

	if (!proceed) return;

	// Second typed confirmation
	while (true) {
		const typed = await prompt({
			title: "Confirm deletion",
			description: `Type "${data.name}" to confirm deletion`,
			placeholder: data.name,
		});

		if (typed === null) return; // user cancelled prompt
		if (typed === data.name) {
			await deleteMutation(data);
			return;
		}
	}
}
