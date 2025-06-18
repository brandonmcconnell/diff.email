"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { EllipsisVertical, Inbox, Search } from "lucide-react";

export function Section3() {
	return (
		<div className="bg-background">
			{" "}
			{/* Add border border-border shadow-sm and rounded-lg class to make this section look like a card */}
			{/* Section header */}
			<div className="container mx-auto flex flex-col gap-6 px-4 pt-4 md:pt-6 lg:px-6">
				{/* Title */}
				<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center md:gap-6">
					<div className="space-y-1">
						<div className="flex items-center justify-between gap-2 md:justify-start">
							<h2 className="font-semibold text-xl">Storage</h2>
							<Badge variant="secondary">Status</Badge>
						</div>
						<p className="text-muted-foreground text-sm">
							Read and write directly to databases and stores from your
							projects.
						</p>
					</div>
					{/* Search and Actions */}
					<div className="flex flex-col-reverse gap-3 md:flex-row">
						<div className="relative">
							<Input type="search" placeholder="Search" className="pl-8" />
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
						</div>
						<div className="flex flex-row-reverse justify-end gap-2 md:flex-row">
							<div className="lg:hidden">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" size="icon">
											<EllipsisVertical className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem>Edit</DropdownMenuItem>
										<DropdownMenuItem>View</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
							<Button variant="outline" className="hidden lg:inline-flex">
								View
							</Button>
							<Button variant="outline" className="hidden lg:inline-flex">
								Edit
							</Button>
							<Button>Create new</Button>
						</div>
					</div>
				</div>
			</div>
			{/* Section body */}
			<div className="container mx-auto px-4 py-6 lg:px-6">
				<div className="flex w-full flex-col items-center gap-6 rounded-md border border-border border-dashed p-6 text-center">
					<div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-card text-card-foreground shadow-sm">
						<Inbox className="h-6 w-6" />
					</div>
					<div className="space-y-2">
						<h1 className="font-semibold text-lg md:text-xl">
							No databases added
						</h1>
						<p className="text-muted-foreground text-sm">
							Read and write directly to databases and stores from your
							projects.
						</p>
					</div>
					<div className="flex w-full flex-col items-stretch justify-center gap-3 md:flex-row md:items-center">
						<Button size="sm">Create new</Button>
						<Button variant="outline" size="sm">
							Learn more
						</Button>
					</div>
				</div>
			</div>
			{/* Section footer */}
			<div className="border-border border-t py-4">
				<div className="container mx-auto flex flex-col items-start justify-between gap-4 px-4 md:flex-row md:items-center lg:px-6">
					<div className="w-full text-muted-foreground text-sm">
						Replace this text with your content
					</div>
					<div className="flex flex-row-reverse items-center gap-2 md:flex-row">
						<Button variant="outline">View</Button>
						<Button variant="outline">Edit</Button>
						<Button>Save</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
