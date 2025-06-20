"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerDialogHandlers } from "@/lib/dialogs";
import type { ConfirmOptions, PromptOptions } from "@/lib/dialogs";
import { useCallback, useEffect, useState } from "react";

// ------------------------------------------------------------------------------------
// Internal types
// ------------------------------------------------------------------------------------

type ConfirmRequest = {
	type: "confirm";
	opts: ConfirmOptions;
	resolve: (value: boolean) => void;
};

type PromptRequest = {
	type: "prompt";
	opts: PromptOptions<unknown>;
	resolve: (value: unknown | null) => void;
};

type Request = ConfirmRequest | PromptRequest;

// ------------------------------------------------------------------------------------
// Provider implementation
// ------------------------------------------------------------------------------------

export function DialogProvider({ children }: { children: React.ReactNode }) {
	const [queue, setQueue] = useState<Request[]>([]);
	const [active, setActive] = useState<Request | null>(null);

	// Exposed helpers that push requests into queue
	const enqueueConfirm = useCallback(
		(opts: ConfirmOptions) =>
			new Promise<boolean>((resolve) => {
				setQueue((q) => [...q, { type: "confirm", opts, resolve }]);
			}),
		[],
	);

	const enqueuePrompt = useCallback(<T,>(opts: PromptOptions<T>) => {
		return new Promise<T | null>((resolve) => {
			setQueue(
				(q) =>
					[
						...q,
						{
							type: "prompt",
							opts: opts as PromptOptions<unknown>,
							resolve,
						} as PromptRequest,
					] as Request[],
			);
		});
	}, []);

	// Register helpers exactly once
	useEffect(() => {
		registerDialogHandlers(enqueueConfirm, enqueuePrompt);
	}, [enqueueConfirm, enqueuePrompt]);

	// When active completes, pop next
	useEffect(() => {
		if (!active && queue.length) {
			setActive(queue[0]);
			setQueue((q) => q.slice(1));
		}
	}, [active, queue]);

	const handleResolve = (value: unknown) => {
		if (!active) return;
		if (active.type === "confirm") {
			active.resolve(value as boolean);
		} else {
			active.resolve(value as string | null);
		}
		setActive(null);
	};

	const renderConfirm = () => {
		if (active?.type !== "confirm") return null;
		const opts = active.opts;
		const dismissible = opts.dismissible ?? false; // confirm default

		if (!dismissible) {
			// AlertDialog (blocking)
			return (
				<AlertDialog open>
					<AlertDialogContent>
						<AlertDialogHeader>
							{opts.title && <AlertDialogTitle>{opts.title}</AlertDialogTitle>}
							{opts.description && (
								<AlertDialogDescription>
									{opts.description}
								</AlertDialogDescription>
							)}
							{opts.content}
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel onClick={() => handleResolve(false)}>
								{opts.cancelText ?? "Cancel"}
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => handleResolve(true)}
								className={
									opts.variant === "destructive"
										? "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive"
										: undefined
								}
							>
								{opts.confirmText ?? "OK"}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			);
		}

		// Dismissible: use Dialog
		return (
			<Dialog open onOpenChange={(open) => !open && handleResolve(false)}>
				<DialogContent showCloseButton={false}>
					<DialogHeader>
						{opts.title && <DialogTitle>{opts.title}</DialogTitle>}
						{opts.description && (
							<DialogDescription>{opts.description}</DialogDescription>
						)}
					</DialogHeader>
					{opts.content}
					<DialogFooter>
						<DialogClose asChild>
							<Button
								variant="outline"
								type="button"
								onClick={() => handleResolve(false)}
							>
								{opts.cancelText ?? "Cancel"}
							</Button>
						</DialogClose>
						<Button type="button" onClick={() => handleResolve(true)}>
							{opts.confirmText ?? "OK"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	};

	const renderPrompt = () => {
		if (active?.type !== "prompt") return null;
		return <PromptDialog request={active} onResolve={handleResolve} />;
	};

	return (
		<>
			{children}
			{renderConfirm()}
			{renderPrompt()}
		</>
	);
}

// ------------------------------------------------------------------------------------
// Prompt dialog component (isolated to own component so we can use hooks safely)
// ------------------------------------------------------------------------------------

type PromptDialogProps = {
	request: PromptRequest;
	onResolve: (value: unknown | null) => void;
};

function PromptDialog({ request, onResolve }: PromptDialogProps) {
	const { opts } = request;
	const dismissible = opts.dismissible ?? true; // prompt default

	// If schema provided, build form
	if (opts.schema) {
		return <FormPromptDialog request={request} onResolve={onResolve} />;
	}

	// If input is hidden
	if (opts.showInput === false) {
		return (
			<BasicPromptDialog
				request={request}
				onResolve={onResolve}
				dismissible={dismissible}
				hideInput
			/>
		);
	}

	// default prompt with single input
	return (
		<BasicPromptDialog
			request={request}
			onResolve={onResolve}
			dismissible={dismissible}
		/>
	);
}

// ------------ BasicPromptDialog (optionally hide input) -------------
type BasicPromptDialogProps = {
	request: PromptRequest;
	onResolve: (value: unknown | null) => void;
	dismissible: boolean;
	hideInput?: boolean;
};

function BasicPromptDialog({
	request,
	onResolve,
	dismissible,
	hideInput,
}: BasicPromptDialogProps) {
	const { opts } = request;
	const [value, setValue] = useState<string>(opts.defaultValue ?? "");

	const ContentWrapper = dismissible ? DialogContent : AlertDialogContent;
	const contentProps = dismissible ? { showCloseButton: false } : ({} as const);
	const TitleComp = dismissible ? DialogTitle : AlertDialogTitle;
	const DescriptionComp = dismissible
		? DialogDescription
		: AlertDialogDescription;

	const RootComp = dismissible ? Dialog : AlertDialog;
	const CancelComp = dismissible ? DialogClose : AlertDialogCancel;
	const OkComp = dismissible ? Button : AlertDialogAction;

	return (
		<RootComp
			open
			onOpenChange={(open: boolean) => dismissible && !open && onResolve(null)}
		>
			<ContentWrapper {...contentProps}>
				<DialogHeader>
					{opts.title && <TitleComp>{opts.title}</TitleComp>}
					{opts.description && (
						<DescriptionComp>{opts.description}</DescriptionComp>
					)}
				</DialogHeader>
				{opts.content}
				{!hideInput && (
					<Input
						placeholder={opts.placeholder}
						value={value}
						onChange={(e) => setValue(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								onResolve(value);
							}
						}}
						autoFocus
					/>
				)}
				<DialogFooter>
					{dismissible ? (
						<CancelComp asChild>
							<Button
								variant="outline"
								type="button"
								onClick={() => onResolve(null)}
							>
								{opts.cancelText ?? "Cancel"}
							</Button>
						</CancelComp>
					) : (
						<CancelComp onClick={() => onResolve(null)}>
							{opts.cancelText ?? "Cancel"}
						</CancelComp>
					)}
					<OkComp
						{...(dismissible ? {} : { className: "" })}
						onClick={() => onResolve(hideInput ? null : value)}
					>
						{opts.okText ?? "OK"}
					</OkComp>
				</DialogFooter>
			</ContentWrapper>
		</RootComp>
	);
}

import { Checkbox } from "@/components/ui/checkbox";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// ------------ FormPromptDialog -----------------------------
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

type FormPromptDialogProps = {
	request: PromptRequest;
	onResolve: (value: unknown | null) => void;
};

function FormPromptDialog({ request, onResolve }: FormPromptDialogProps) {
	const { opts } = request;
	const schema = opts.schema as z.ZodObject<Record<string, z.ZodTypeAny>>;
	const dismissible = opts.dismissible ?? true;

	const form = useForm<Record<string, unknown>>({
		resolver: zodResolver(schema),
		defaultValues: opts.defaultValues as Record<string, unknown> | undefined,
	});

	const handleSubmit = form.handleSubmit((values) => {
		onResolve(values);
	});

	const ContentWrapper = dismissible ? DialogContent : AlertDialogContent;
	const formcontentProps = dismissible
		? { showCloseButton: false }
		: ({} as const);
	const TitleComp = dismissible ? DialogTitle : AlertDialogTitle;
	const DescriptionComp = dismissible
		? DialogDescription
		: AlertDialogDescription;
	const RootComp = dismissible ? Dialog : AlertDialog;
	const CancelComp = dismissible ? DialogClose : AlertDialogCancel;

	// Function to build fields based on schema shape
	function renderFields() {
		if (!schema || !(schema instanceof z.ZodObject)) return null;
		const shape = schema.shape;
		return Object.entries(shape).map(([name, fieldSchema]) => {
			// Determine type
			if (
				fieldSchema instanceof z.ZodString ||
				fieldSchema instanceof z.ZodNumber
			) {
				const inputType =
					fieldSchema instanceof z.ZodNumber ? "number" : "text";
				return (
					<FormField
						key={name}
						control={form.control}
						name={name as string}
						render={({ field }) => (
							<FormItem>
								<FormLabel className="capitalize">{name}</FormLabel>
								<FormControl>
									<Input type={inputType} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				);
			}

			if (fieldSchema instanceof z.ZodBoolean) {
				return (
					<FormField
						key={name}
						control={form.control}
						name={name as string}
						render={({ field }) => (
							<FormItem className="flex flex-row items-start space-x-2 space-y-0">
								<FormControl>
									<Checkbox
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
								<FormLabel className="capitalize">{name}</FormLabel>
								<FormMessage />
							</FormItem>
						)}
					/>
				);
			}

			if (
				fieldSchema instanceof z.ZodEnum ||
				fieldSchema instanceof z.ZodNativeEnum
			) {
				const enumLike = fieldSchema as unknown as {
					options?: string[];
					_def?: { values: Record<string, unknown> };
				};
				const options =
					enumLike.options ?? Object.values(enumLike._def?.values ?? {});
				return (
					<FormField
						key={name}
						control={form.control}
						name={name as string}
						render={({ field }) => (
							<FormItem>
								<FormLabel className="capitalize">{name}</FormLabel>
								<FormControl>
									<RadioGroup
										onValueChange={field.onChange}
										value={field.value}
										className="grid gap-2"
									>
										{options.map((opt: string) => (
											<div key={opt} className="flex items-center space-x-2">
												<RadioGroupItem value={opt} />
												<Label
													className="capitalize"
													htmlFor={`${name}-${opt}`}
												>
													{opt}
												</Label>
											</div>
										))}
									</RadioGroup>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				);
			}

			if (
				fieldSchema instanceof z.ZodArray &&
				(fieldSchema.element instanceof z.ZodEnum ||
					fieldSchema.element instanceof z.ZodNativeEnum)
			) {
				const elemEnumLike = fieldSchema.element as unknown as {
					options?: string[];
					_def?: { values: Record<string, unknown> };
				};
				const options =
					elemEnumLike.options ??
					Object.values(elemEnumLike._def?.values ?? {});
				return (
					<FormField
						key={name}
						control={form.control}
						name={name as string}
						render={({ field }) => (
							<FormItem>
								<FormLabel className="capitalize">{name}</FormLabel>
								<FormControl>
									<div className="grid gap-2">
										{options.map((opt: string) => (
											<div key={opt} className="flex items-center space-x-2">
												<Checkbox
													checked={field.value?.includes(opt)}
													onCheckedChange={(checked) => {
														const current: string[] = field.value ?? [];
														if (checked) {
															field.onChange([...current, opt]);
														} else {
															field.onChange(current.filter((v) => v !== opt));
														}
													}}
												/>
												<Label
													className="capitalize"
													htmlFor={`${name}-${opt}`}
												>
													{opt}
												</Label>
											</div>
										))}
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				);
			}

			// fallback text field
			return (
				<FormField
					key={name}
					control={form.control}
					name={name as string}
					render={({ field }) => (
						<FormItem>
							<FormLabel className="capitalize">{name}</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			);
		});
	}

	return (
		<RootComp
			open
			onOpenChange={(open: boolean) => dismissible && !open && onResolve(null)}
		>
			<ContentWrapper {...formcontentProps}>
				<DialogHeader>
					{opts.title && <TitleComp>{opts.title}</TitleComp>}
					{opts.description && (
						<DescriptionComp>{opts.description}</DescriptionComp>
					)}
				</DialogHeader>
				{opts.content}
				<Form {...form}>
					<form onSubmit={handleSubmit} className="grid gap-4 py-2">
						{renderFields()}
						<DialogFooter className="pt-4">
							{dismissible ? (
								<CancelComp asChild>
									<Button
										variant="outline"
										type="button"
										onClick={() => onResolve(null)}
									>
										{opts.cancelText ?? "Cancel"}
									</Button>
								</CancelComp>
							) : (
								<CancelComp onClick={() => onResolve(null)}>
									{opts.cancelText ?? "Cancel"}
								</CancelComp>
							)}
							<Button type="submit">{opts.okText ?? "OK"}</Button>
						</DialogFooter>
					</form>
				</Form>
			</ContentWrapper>
		</RootComp>
	);
}
