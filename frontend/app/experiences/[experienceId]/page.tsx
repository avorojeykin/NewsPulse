import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import CategoryLanding from "@/components/CategoryLanding";
import { theme } from "@/lib/theme";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	// The headers contains the user token
	const headersList = await headers();

	// The experienceId is a path param
	const { experienceId } = await params;

	// Try to verify user token - handle development mode
	let userId: string;
	let isDevMode = false;

	try {
		const tokenResult = await whopSdk.verifyUserToken(headersList);
		userId = tokenResult.userId;
	} catch (error) {
		// Development mode - use the agent user ID from env
		isDevMode = true;
		userId = process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID || '';

		if (!userId) {
			return (
				<div className="flex flex-col justify-center items-center h-screen px-8 text-white" style={{ backgroundColor: theme.colors.background.primary }}>
					<div className="max-w-2xl text-center space-y-4">
						<div className="text-6xl mb-4">⚠️</div>
						<h1 className="text-3xl font-bold text-red-400">Development Mode</h1>
						<p className="text-lg text-slate-300">
							You need to access this app through Whop, not directly at localhost:3000
						</p>
						<div className="p-6 rounded-2xl text-left space-y-3 border-2" style={{ backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.status.warning }}>
							<h2 className="font-bold text-xl mb-4">How to access your app:</h2>
							<ol className="list-decimal list-inside space-y-2 text-slate-300">
								<li>Go to your Whop community</li>
								<li>Navigate to <strong>Tools</strong></li>
								<li>Find and open <strong>NewsPulse</strong></li>
								<li>The app will load inside Whop's iframe</li>
							</ol>
						</div>
						<p className="text-sm text-slate-400 mt-4">
							Alternatively, ensure NEXT_PUBLIC_WHOP_AGENT_USER_ID is set in .env.local for testing
						</p>
					</div>
				</div>
			);
		}
	}

	// Get user access info
	const result = await whopSdk.access.checkIfUserHasAccessToExperience({
		userId,
		experienceId,
	});

	const user = await whopSdk.users.getUser({ userId });
	const experience = await whopSdk.experiences.getExperience({ experienceId });

	// Either: 'admin' | 'customer' | 'no_access';
	const { accessLevel } = result;

	return (
		<div className="min-h-screen text-white" style={{ backgroundColor: theme.colors.background.primary }}>
			{isDevMode && (
				<div className="border-b-2 border-yellow-600/30" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
					<div className="max-w-7xl mx-auto px-4 py-3">
						<div className="flex items-center gap-3">
							<div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
							<p className="text-yellow-400 font-semibold text-sm">Development Mode Active</p>
							<p className="text-xs text-yellow-200/80">
								Using agent user ID for testing
							</p>
						</div>
					</div>
				</div>
			)}

			{/* User Info Header - Compact */}
			<div className="border-b" style={{ backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.background.tertiary }}>
				<div className="max-w-7xl mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-6">
							<div>
								<p className="text-xs text-slate-400 uppercase tracking-wide">User</p>
								<p className="font-semibold text-white">{user.name} <span className="text-slate-400">@{user.username}</span></p>
							</div>
							<div className="h-8 w-px bg-slate-700"></div>
							<div>
								<p className="text-xs text-slate-400 uppercase tracking-wide">Access</p>
								<div className="flex items-center gap-2">
									{result.hasAccess ? (
										<>
											<div className="w-2 h-2 rounded-full bg-green-400" />
											<p className="font-semibold text-green-400">Active</p>
										</>
									) : (
										<>
											<div className="w-2 h-2 rounded-full bg-red-400" />
											<p className="font-semibold text-red-400">No Access</p>
										</>
									)}
									<span className="text-xs text-slate-500">({accessLevel})</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content - Category Landing */}
			<CategoryLanding />
		</div>
	);
}
