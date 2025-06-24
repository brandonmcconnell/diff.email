"use client";

import {
	EllipsisVertical,
	ExternalLink,
	HeartHandshake,
	Plus,
} from "lucide-react";
import BetaBanner from "@/components/beta-plan-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export default function PlanSettingsPage() {
	return (
		<div className="container mx-auto flex flex-col gap-6 p-4 md:gap-8 md:p-6">
			{/* Beta plan banner */}
			<BetaBanner
				title="You're on the unlimited beta plan."
				subtitle="API plans and usage limits will apply after public launch."
				icon={HeartHandshake}
			/>

			{/* Plan summary */}
			<Card className="pb-0">
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span className="font-semibold text-lg">Plan Summary</span>
					</CardTitle>
					<Badge variant="secondary">Unlimited Beta</Badge>
				</CardHeader>
				<CardContent className="px-6">
					<div className="mb-4">
						<div className="mb-2 flex items-center justify-between">
							<span className="font-semibold">Unlimited usage</span>
						</div>
						<Progress value={100} className="h-4" />
					</div>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div>
							<p className="text-muted-foreground text-sm">Price/Month</p>
							<p className="font-semibold">$0</p>
						</div>
						<div>
							<p className="text-muted-foreground text-sm">Included Credits</p>
							<p className="font-semibold">Unlimited</p>
						</div>
						<div>
							<p className="text-muted-foreground text-sm">Renewal Date</p>
							<p className="font-semibold">N/A (beta)</p>
						</div>
					</div>
				</CardContent>
				<CardFooter className="flex justify-end rounded-b-lg border-t bg-muted py-6">
					<Button disabled>
						Upgrade plan <ExternalLink className="ml-2 h-4 w-4" />
					</Button>
				</CardFooter>
			</Card>

			{/* Public API settings */}
			<Card>
				<CardHeader className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
					<div>
						<CardTitle className="font-semibold text-xl">
							Public API Settings
						</CardTitle>
						<p className="text-muted-foreground text-sm">
							Manage and configure access to the Public API.
						</p>
					</div>
					<Button disabled>
						<Plus className="mr-2 h-4 w-4" /> New
					</Button>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<Table className="min-w-[480px]">
							<TableHeader>
								<TableRow>
									<TableHead className="font-medium">API Name</TableHead>
									<TableHead className="hidden font-medium sm:table-cell">
										Date of Creation
									</TableHead>
									<TableHead className="font-medium">Status</TableHead>
									<TableHead className="font-medium" />
								</TableRow>
							</TableHeader>
							<TableBody>
								<TableRow>
									<TableCell className="font-medium">Public Data API</TableCell>
									<TableCell className="hidden sm:table-cell">—</TableCell>
									<TableCell>
										<Badge className="bg-primary">Active</Badge>
									</TableCell>
									<TableCell className="flex justify-end">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="h-8 w-8">
													<EllipsisVertical className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem disabled>Edit</DropdownMenuItem>
												<DropdownMenuItem disabled>Duplicate</DropdownMenuItem>
												<DropdownMenuItem disabled className="text-red-600">
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			{/* Private API settings */}
			<Card>
				<CardHeader className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
					<div>
						<CardTitle className="font-semibold text-xl">
							Private API Settings
						</CardTitle>
						<p className="text-muted-foreground text-sm">
							Manage and configure access to the Private API.
						</p>
					</div>
					<Button disabled>
						<Plus className="mr-2 h-4 w-4" /> New
					</Button>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<Table className="min-w-[480px]">
							<TableHeader>
								<TableRow>
									<TableHead className="font-medium">API Name</TableHead>
									<TableHead className="hidden font-medium sm:table-cell">
										Date of Creation
									</TableHead>
									<TableHead className="font-medium">Status</TableHead>
									<TableHead className="font-medium" />
								</TableRow>
							</TableHeader>
							<TableBody>
								<TableRow>
									<TableCell className="font-medium">
										Internal Data API
									</TableCell>
									<TableCell className="hidden sm:table-cell">—</TableCell>
									<TableCell>
										<Badge className="bg-primary">Active</Badge>
									</TableCell>
									<TableCell className="flex justify-end">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="h-8 w-8">
													<EllipsisVertical className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem disabled>Edit</DropdownMenuItem>
												<DropdownMenuItem disabled>Duplicate</DropdownMenuItem>
												<DropdownMenuItem disabled className="text-red-600">
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
