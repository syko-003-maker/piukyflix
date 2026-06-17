import { useGetAdminStats } from "@workspace/api-client-react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Users, Film, Tv, FolderTree, PlayCircle, MessageSquare } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats();

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Platform statistics and recent activity</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-32 bg-secondary animate-pulse rounded-xl border border-border" />
            ))}
          </div>
        ) : stats ? (
          <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard 
                title="Total Users" 
                value={stats.totalUsers} 
                icon={<Users className="h-6 w-6 text-blue-500" />} 
              />
              <StatCard 
                title="Total Movies" 
                value={stats.totalMovies} 
                icon={<Film className="h-6 w-6 text-primary" />} 
              />
              <StatCard 
                title="Total Series" 
                value={stats.totalSeries} 
                icon={<Tv className="h-6 w-6 text-green-500" />} 
              />
              <StatCard 
                title="Categories" 
                value={stats.totalCategories} 
                icon={<FolderTree className="h-6 w-6 text-yellow-500" />} 
              />
              <StatCard 
                title="Watch Events" 
                value={stats.totalWatchEvents} 
                icon={<PlayCircle className="h-6 w-6 text-purple-500" />} 
              />
              <StatCard 
                title="Comments" 
                value={stats.totalComments} 
                icon={<MessageSquare className="h-6 w-6 text-pink-500" />} 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Content */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Top Content by Views</h2>
                <div className="space-y-4">
                  {stats.topContent.map((content, index) => (
                    <div key={content.id} className="flex items-center gap-4">
                      <div className="text-xl font-bold text-muted-foreground w-6">{index + 1}</div>
                      <div className="w-12 h-16 bg-secondary rounded overflow-hidden flex-shrink-0">
                        {content.posterUrl && <img src={content.posterUrl} alt={content.title} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white truncate">{content.title}</h4>
                        <p className="text-sm text-muted-foreground capitalize">{content.contentType}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">{content.viewCount.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">views</div>
                      </div>
                    </div>
                  ))}
                  {stats.topContent.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No data available</p>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Recent Watch Activity</h2>
                <div className="space-y-4">
                  {stats.recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        <PlayCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300 truncate">
                          User <span className="font-mono text-muted-foreground">{activity.userId.slice(0,8)}...</span> watched <span className="font-bold text-white">{activity.content?.title || "Unknown"}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.watchedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {stats.recentActivity.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4">
      <div className="p-3 bg-secondary rounded-lg">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold text-white">{value.toLocaleString()}</h3>
      </div>
    </div>
  );
}