import { confirm, prompt } from "@/lib/dialogs";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function pluralize(count: number, singular: string, plural?: string) {
	return count === 1 ? singular : (plural ?? `${singular}s`);
}

// Map of container type -> child subtype used in default confirmation text.
export const TYPES_SUBTYPES: Record<string, string> = {
	project: "email",
	email: "version",
};

export function deleteConfirmationMessage({
	name,
	count = 0,
	type,
	subtype,
}: {
	name: string;
	count?: number;
	type: string;
	/** Optional explicit subtype override */
	subtype?: string;
}) {
	const resolvedSubtype = subtype ?? TYPES_SUBTYPES[type];
	const suffix =
		count && resolvedSubtype
			? ` and its ${count} ${pluralize(count, resolvedSubtype)}`
			: "";
	return `Delete the "${name}" ${type}${suffix}? This action is irreversible.\n\nAre you sure you want to continue?`;
}

type GenericDataType = {
	id: string;
	name: string;
	count?: number;
	type: string;
	subtype?: string;
};

/**
 * Presents a destructive two-step confirmation (confirm + typed prompt) before
 * invoking the provided mutation. Existing call sites remain unchanged.
 */
export async function confirmDeletion<DataType extends GenericDataType>(
	data: DataType,
	deleteMutation: (data: DataType) => void | Promise<void>,
) {
	const proceed = await confirm({
		title: `Delete ${data.type}`,
		description: deleteConfirmationMessage(data),
		confirmText: "Delete",
		cancelText: "Cancel",
		variant: "destructive",
	});

	if (!proceed) return;

	// Require user to type the resource name to continue.
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
