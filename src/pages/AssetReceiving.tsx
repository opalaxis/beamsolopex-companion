import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import assetAPI, { Asset } from "@/lib/assetApi";
import assetReceiptAPI, { AssetReceipt, AssetReceiptLocation } from "@/lib/assetReceiptApi";
import conditionAPI, { Condition } from "@/lib/conditionApi";
import operationalStatusAPI, { OperationalStatus } from "@/lib/operationalStatusApi";
import locationAPI, { Location } from "@/lib/locationApi";
import { useAuth } from "@/contexts/AuthContext";
import Select from "react-select";
import {
  ArrowLeft,
  Save,
  PlusCircle,
  Trash2,
  Pencil,
  MoreVertical,
  Search,
  Filter,
  X,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

type ViewMode = "list" | "create" | "edit" | "view";

const emptyLocation: AssetReceiptLocation = {
  location_id: "",
  quantity: 1,
  licence_plate: "",
  manufacture_date: "",
  condition_id: "",
  operational_status_id: "",
  remarks: "",
  serial_numbers: [""],
  tag_numbers: [""],
};

const initialFormData: AssetReceipt = {
  asset_id: "",
  receipt_date: new Date().toISOString().split("T")[0],
  received_by: "",
  remarks: "",
  locations: [{ ...emptyLocation }],
};

const AssetReceiving = () => {
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mode, setMode] = useState<ViewMode>("list");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<AssetReceipt | null>(null);
  
  // Data State
  const [assetReceipts, setAssetReceipts] = useState<AssetReceipt[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [operationalStatuses, setOperationalStatuses] = useState<OperationalStatus[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  
  // Form State
  const [formData, setFormData] = useState<AssetReceipt>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Table State
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ asset: "", location: "", date: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      try {
        const [receiptsData, assetsData, conditionsData, statusesData, locationsData] = 
          await Promise.all([
            assetReceiptAPI.getAll(),
            assetAPI.getAll(),
            conditionAPI.getAll(),
            operationalStatusAPI.getAll(),
            locationAPI.getAll(),
          ]);
        
        setAssetReceipts(receiptsData);
        setAssets(assetsData);
        setConditions(conditionsData);
        setOperationalStatuses(statusesData);
        setLocations(locationsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setFetching(false);
      }
    };
    
    fetchData();
  }, []);

  // Permission checks
  const canCreate = hasPermission("create_asset_receipt") || hasPermission("manage_asset_receipts");
  const canEdit = (receipt: AssetReceipt) => {
    if (hasPermission("edit_asset_receipt") || hasPermission("manage_asset_receipts")) return true;
    if (user && receipt.received_by === user.name) return true;
    return false;
  };
  const canDelete = (receipt: AssetReceipt) => {
    if (hasPermission("delete_asset_receipt") || hasPermission("manage_asset_receipts")) return true;
    return false;
  };
  const canView = hasPermission("view_asset_receipt") || hasPermission("manage_asset_receipts");

  // Filtered receipts
  const filteredReceipts = useMemo(() => {
    return assetReceipts.filter((receipt) => {
      let match = true;
      if (searchTerm) {
        const assetName = assets.find(a => a.id === Number(receipt.asset_id))?.item_name?.toLowerCase() || "";
        match = match && (
          receipt.id?.toString().includes(searchTerm.toLowerCase()) ||
          assetName.includes(searchTerm.toLowerCase()) ||
          (receipt.tag_no || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (receipt.received_by || "").toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      if (filters.asset) {
        match = match && receipt.asset_id?.toString() === filters.asset;
      }
      if (filters.date) {
        match = match && receipt.created_at?.slice(0, 10) === filters.date;
      }
      return match;
    });
  }, [assetReceipts, searchTerm, filters, assets]);

  // Pagination
  const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentReceipts = filteredReceipts.slice(startIndex, startIndex + itemsPerPage);

  // Asset options for Select
  const assetOptions = useMemo(() => 
    assets.filter(a => a && a.id != null).map(a => ({ 
      value: a.id.toString(), 
      label: a.item_name || `Asset #${a.id}` 
    })), 
  [assets]);

  const locationOptions = useMemo(() => 
    locations.map(l => ({ value: l.id.toString(), label: l.name })),
  [locations]);

  const conditionOptions = useMemo(() =>
    conditions.map(c => ({ value: c.id.toString(), label: c.name })),
  [conditions]);

  const statusOptions = useMemo(() =>
    operationalStatuses.map(s => ({ value: s.id.toString(), label: s.name })),
  [operationalStatuses]);

  // Form handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleAssetSelect = (option: { value: string; label: string } | null) => {
    setFormData(prev => ({ ...prev, asset_id: option ? option.value : "" }));
    if (errors.asset_id) setErrors(prev => ({ ...prev, asset_id: "" }));
  };

  const handleLocationChange = (idx: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.map((loc, i) =>
        i === idx ? { ...loc, [field]: value } : loc
      ),
    }));
  };

  const handleLocationSelectChange = (idx: number, field: string, option: { value: string } | null) => {
    handleLocationChange(idx, field, option ? option.value : "");
  };

  // Location management
  const addLocation = () => {
    setFormData(prev => ({
      ...prev,
      locations: [...prev.locations, { ...emptyLocation }],
    }));
  };

  const removeLocation = (idx: number) => {
    if (formData.locations.length > 1) {
      setFormData(prev => ({
        ...prev,
        locations: prev.locations.filter((_, i) => i !== idx),
      }));
    }
  };

  // Serial/Tag number handlers
  const addSerialField = (locIdx: number) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.map((loc, i) =>
        i === locIdx ? { ...loc, serial_numbers: [...(loc.serial_numbers || []), ""] } : loc
      ),
    }));
  };

  const removeSerialField = (locIdx: number, serialIdx: number) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.map((loc, i) =>
        i === locIdx
          ? { ...loc, serial_numbers: (loc.serial_numbers || []).filter((_, sidx) => sidx !== serialIdx) }
          : loc
      ),
    }));
  };

  const handleSerialChange = (locIdx: number, serialIdx: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.map((loc, i) =>
        i === locIdx
          ? {
              ...loc,
              serial_numbers: (loc.serial_numbers || []).map((s, sidx) => sidx === serialIdx ? value : s),
            }
          : loc
      ),
    }));
  };

  const addTagField = (locIdx: number) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.map((loc, i) =>
        i === locIdx ? { ...loc, tag_numbers: [...(loc.tag_numbers || []), ""] } : loc
      ),
    }));
  };

  const removeTagField = (locIdx: number, tagIdx: number) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.map((loc, i) =>
        i === locIdx
          ? { ...loc, tag_numbers: (loc.tag_numbers || []).filter((_, tidx) => tidx !== tagIdx) }
          : loc
      ),
    }));
  };

  const handleTagChange = (locIdx: number, tagIdx: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.map((loc, i) =>
        i === locIdx
          ? {
              ...loc,
              tag_numbers: (loc.tag_numbers || []).map((t, tidx) => tidx === tagIdx ? value : t),
            }
          : loc
      ),
    }));
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.asset_id) newErrors.asset_id = "Asset is required";
    if (!formData.receipt_date) newErrors.receipt_date = "Receipt date is required";
    if (!formData.received_by?.trim()) newErrors.received_by = "Received by is required";

    formData.locations.forEach((loc, idx) => {
      if (!loc.location_id) newErrors[`location_${idx}_location_id`] = "Location is required";
      if (!loc.quantity || loc.quantity < 1) newErrors[`location_${idx}_quantity`] = "Quantity must be at least 1";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await assetReceiptAPI.update(editingId, formData);
        toast.success("Asset receipt updated successfully");
      } else {
        await assetReceiptAPI.create(formData);
        toast.success("Asset receipt created successfully");
      }
      
      // Refresh list
      const updatedReceipts = await assetReceiptAPI.getAll();
      setAssetReceipts(updatedReceipts);
      resetForm();
      setMode("list");
    } catch (error: any) {
      console.error("Error saving asset receipt:", error);
      toast.error(error.response?.data?.message || "Failed to save asset receipt");
    } finally {
      setLoading(false);
    }
  };

  // Edit handler
  const handleEdit = (receipt: AssetReceipt) => {
    setEditingId(receipt.id || null);
    setFormData({
      asset_id: receipt.asset_id?.toString() || "",
      receipt_date: receipt.receipt_date || receipt.created_at?.slice(0, 10) || "",
      received_by: receipt.received_by || "",
      remarks: receipt.remarks || "",
      locations: receipt.locations?.length ? receipt.locations : [{ ...emptyLocation }],
    });
    setMode("edit");
  };

  // View handler
  const handleView = (receipt: AssetReceipt) => {
    setSelectedReceipt(receipt);
    setMode("view");
  };

  // Delete handler
  const handleDelete = async () => {
    if (!selectedReceipt?.id) return;
    
    setLoading(true);
    try {
      await assetReceiptAPI.remove(selectedReceipt.id);
      toast.success("Asset receipt deleted successfully");
      const updatedReceipts = await assetReceiptAPI.getAll();
      setAssetReceipts(updatedReceipts);
      setDeleteDialogOpen(false);
      setSelectedReceipt(null);
    } catch (error: any) {
      console.error("Error deleting asset receipt:", error);
      toast.error(error.response?.data?.message || "Failed to delete asset receipt");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData(initialFormData);
    setErrors({});
    setEditingId(null);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilters({ asset: "", location: "", date: "" });
    setCurrentPage(1);
  };

  // Get asset name by ID
  const getAssetName = (assetId: number | string) => {
    return assets.find(a => a.id === Number(assetId))?.item_name || `Asset #${assetId}`;
  };

  // Render list view
  if (mode === "list") {
    return (
      <div className="flex h-full min-h-screen bg-background">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="flex-1 overflow-y-auto p-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/assets")}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <h1 className="text-2xl font-bold text-foreground">Asset Receipts</h1>
              </div>
              {canCreate && (
                <Button 
                  onClick={() => { resetForm(); setMode("create"); }}
                  className="flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  Create Receipt
                </Button>
              )}
            </div>

            {/* Table Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search receipts..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiltersOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="border rounded px-2 py-1 text-sm bg-background"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Filter Sidebar */}
            {filtersOpen && (
              <div className="fixed inset-0 z-50">
                <div className="absolute inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} />
                <div className="absolute top-0 right-0 w-80 h-full bg-background border-l shadow-lg p-6 overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Filters</h3>
                    <Button variant="ghost" size="icon" onClick={() => setFiltersOpen(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">Asset</Label>
                      <select
                        value={filters.asset}
                        onChange={(e) => setFilters(prev => ({ ...prev, asset: e.target.value }))}
                        className="w-full mt-1 border rounded px-3 py-2 bg-background"
                      >
                        <option value="">All Assets</option>
                        {assets.map(a => (
                          <option key={a.id} value={a.id}>{a.item_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">Date</Label>
                      <Input
                        type="date"
                        value={filters.date}
                        onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <Button variant="outline" className="w-full" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Asset</TableHead>
                        <TableHead>Received By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fetching ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ) : currentReceipts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                            No asset receipts found
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentReceipts.map((receipt) => (
                          <TableRow key={receipt.id}>
                            <TableCell className="font-medium">{receipt.id}</TableCell>
                            <TableCell>{getAssetName(receipt.asset_id)}</TableCell>
                            <TableCell>{receipt.received_by}</TableCell>
                            <TableCell>
                              {receipt.created_at ? new Date(receipt.created_at).toLocaleDateString() : "-"}
                            </TableCell>
                            <TableCell>{receipt.quantity || "-"}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {canView && (
                                    <DropdownMenuItem onClick={() => handleView(receipt)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </DropdownMenuItem>
                                  )}
                                  {canEdit(receipt) && (
                                    <DropdownMenuItem onClick={() => handleEdit(receipt)}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                  )}
                                  {canDelete(receipt) && (
                                    <DropdownMenuItem 
                                      className="text-destructive"
                                      onClick={() => { setSelectedReceipt(receipt); setDeleteDialogOpen(true); }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <span className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredReceipts.length)} of {filteredReceipts.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(1)}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="px-3 text-sm">
                        {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Asset Receipt</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this asset receipt? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </main>
        </div>
      </div>
    );
  }

  // Render view mode
  if (mode === "view" && selectedReceipt) {
    return (
      <div className="flex h-full min-h-screen bg-background">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setMode("list"); setSelectedReceipt(null); }}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-foreground">View Asset Receipt #{selectedReceipt.id}</h1>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Receipt Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Asset</Label>
                    <p className="font-medium">{getAssetName(selectedReceipt.asset_id)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Receipt Date</Label>
                    <p className="font-medium">
                      {selectedReceipt.receipt_date || selectedReceipt.created_at?.slice(0, 10) || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Received By</Label>
                    <p className="font-medium">{selectedReceipt.received_by || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Quantity</Label>
                    <p className="font-medium">{selectedReceipt.quantity || "-"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">Remarks</Label>
                    <p className="font-medium">{selectedReceipt.remarks || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  // Render create/edit form
  return (
    <div className="flex h-full min-h-screen bg-background">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { resetForm(); setMode("list"); }}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              {editingId ? "Edit Asset Receipt" : "Create Asset Receipt"}
            </h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Receipt Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Main form fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>
                      Asset <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      options={assetOptions}
                      value={assetOptions.find(o => o.value === formData.asset_id?.toString()) || null}
                      onChange={handleAssetSelect}
                      isLoading={fetching}
                      placeholder="Select asset..."
                      isClearable
                      classNamePrefix="react-select"
                    />
                    {errors.asset_id && (
                      <p className="text-destructive text-sm">{errors.asset_id}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receipt_date">
                      Receipt Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="date"
                      id="receipt_date"
                      name="receipt_date"
                      value={formData.receipt_date}
                      onChange={handleChange}
                    />
                    {errors.receipt_date && (
                      <p className="text-destructive text-sm">{errors.receipt_date}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="received_by">
                      Received By <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="received_by"
                      name="received_by"
                      value={formData.received_by}
                      onChange={handleChange}
                      placeholder="Enter name"
                    />
                    {errors.received_by && (
                      <p className="text-destructive text-sm">{errors.received_by}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Textarea
                      id="remarks"
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleChange}
                      placeholder="Optional remarks..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Locations */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">Locations</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addLocation}>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Location
                    </Button>
                  </div>

                  {formData.locations.map((loc, idx) => (
                    <Card key={idx} className="border-dashed">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Location #{idx + 1}</CardTitle>
                          {formData.locations.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => removeLocation(idx)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>
                              Location <span className="text-destructive">*</span>
                            </Label>
                            <Select
                              options={locationOptions}
                              value={locationOptions.find(o => o.value === loc.location_id) || null}
                              onChange={(opt) => handleLocationSelectChange(idx, "location_id", opt)}
                              isLoading={fetching}
                              placeholder="Select location..."
                              isClearable
                              classNamePrefix="react-select"
                            />
                            {errors[`location_${idx}_location_id`] && (
                              <p className="text-destructive text-sm">{errors[`location_${idx}_location_id`]}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>
                              Quantity <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              value={loc.quantity}
                              onChange={(e) => handleLocationChange(idx, "quantity", e.target.value)}
                            />
                            {errors[`location_${idx}_quantity`] && (
                              <p className="text-destructive text-sm">{errors[`location_${idx}_quantity`]}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>License Plate</Label>
                            <Input
                              value={loc.licence_plate || ""}
                              onChange={(e) => handleLocationChange(idx, "licence_plate", e.target.value)}
                              placeholder="Optional"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Manufacture Date</Label>
                            <Input
                              type="date"
                              value={loc.manufacture_date || ""}
                              onChange={(e) => handleLocationChange(idx, "manufacture_date", e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Condition</Label>
                            <Select
                              options={conditionOptions}
                              value={conditionOptions.find(o => o.value === loc.condition_id) || null}
                              onChange={(opt) => handleLocationSelectChange(idx, "condition_id", opt)}
                              isLoading={fetching}
                              placeholder="Select condition..."
                              isClearable
                              classNamePrefix="react-select"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Operational Status</Label>
                            <Select
                              options={statusOptions}
                              value={statusOptions.find(o => o.value === loc.operational_status_id) || null}
                              onChange={(opt) => handleLocationSelectChange(idx, "operational_status_id", opt)}
                              isLoading={fetching}
                              placeholder="Select status..."
                              isClearable
                              classNamePrefix="react-select"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Remarks</Label>
                          <Input
                            value={loc.remarks || ""}
                            onChange={(e) => handleLocationChange(idx, "remarks", e.target.value)}
                            placeholder="Location specific remarks..."
                          />
                        </div>

                        {/* Serial Numbers */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Serial Numbers</Label>
                            <Button type="button" variant="ghost" size="sm" onClick={() => addSerialField(idx)}>
                              <PlusCircle className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {(loc.serial_numbers || []).map((s, sidx) => (
                              <div key={sidx} className="flex items-center gap-2">
                                <Input
                                  value={s}
                                  onChange={(e) => handleSerialChange(idx, sidx, e.target.value)}
                                  placeholder={`Serial #${sidx + 1}`}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive shrink-0"
                                  onClick={() => removeSerialField(idx, sidx)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tag Numbers */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Tag Numbers</Label>
                            <Button type="button" variant="ghost" size="sm" onClick={() => addTagField(idx)}>
                              <PlusCircle className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {(loc.tag_numbers || []).map((t, tidx) => (
                              <div key={tidx} className="flex items-center gap-2">
                                <Input
                                  value={t}
                                  onChange={(e) => handleTagChange(idx, tidx, e.target.value)}
                                  placeholder={`Tag #${tidx + 1}`}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive shrink-0"
                                  onClick={() => removeTagField(idx, tidx)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { resetForm(); setMode("list"); }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {editingId ? "Update" : "Create"}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AssetReceiving;
