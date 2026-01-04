import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ClipboardCheck, TrendingUp, Users } from "lucide-react";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const stats = [
    { title: "Total Assets", value: "1,234", icon: Package, color: "text-blue-600" },
    { title: "Pending Receipts", value: "56", icon: ClipboardCheck, color: "text-amber-600" },
    { title: "This Month", value: "+12%", icon: TrendingUp, color: "text-green-600" },
    { title: "Active Users", value: "24", icon: Users, color: "text-purple-600" },
  ];

  return (
    <div className="flex h-full min-h-screen bg-background">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Welcome to BemsolOpex Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Use the sidebar to navigate between Assets and Asset Receiving modules.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
