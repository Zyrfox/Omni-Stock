import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { db } from "@/db"

export default async function MasterDataPage() {
    const vendors = await db.query.masterVendor.findMany();
    const bahan = await db.query.masterBahan.findMany();
    const menus = await db.query.masterMenu.findMany();
    const resep = await db.query.mappingResep.findMany();

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Master Data</h2>
                <p className="text-slate-500 dark:text-slate-400">Manage Vendor, Bahan Baku, Menu, and Resep data synced from Google Sheets.</p>
            </div>

            <Tabs defaultValue="vendor">
                <TabsList className="mb-4">
                    <TabsTrigger value="vendor">Vendor</TabsTrigger>
                    <TabsTrigger value="bahan">Bahan Baku</TabsTrigger>
                    <TabsTrigger value="menu">Menu POS</TabsTrigger>
                    <TabsTrigger value="resep">Resep (Mapping)</TabsTrigger>
                </TabsList>
                <TabsContent value="vendor">
                    <Card>
                        <CardHeader>
                            <CardTitle>Master Vendor</CardTitle>
                            <CardDescription>Daftar vendor penyedia bahan baku.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {vendors.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Vendor ID</TableHead>
                                            <TableHead>Nama</TableHead>
                                            <TableHead>WhatsApp</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {vendors.map(v => (
                                            <TableRow key={v.id}>
                                                <TableCell>{v.id}</TableCell>
                                                <TableCell>{v.nama_vendor}</TableCell>
                                                <TableCell>{v.kontak_wa}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-sm text-slate-500 flex h-32 items-center justify-center border rounded-md border-dashed">No data available. Please sync from Google Sheets.</div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="bahan">
                    <Card>
                        <CardHeader>
                            <CardTitle>Master Bahan Baku</CardTitle>
                            <CardDescription>Daftar bahan mentah, satuan dasar, dan batas minimum stok.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {bahan.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Bahan ID</TableHead>
                                            <TableHead>Nama</TableHead>
                                            <TableHead>Satuan</TableHead>
                                            <TableHead>Batas Min</TableHead>
                                            <TableHead>Vendor ID</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bahan.map(b => (
                                            <TableRow key={b.id}>
                                                <TableCell>{b.id}</TableCell>
                                                <TableCell>{b.nama_bahan}</TableCell>
                                                <TableCell>{b.satuan_dasar}</TableCell>
                                                <TableCell>{b.batas_minimum}</TableCell>
                                                <TableCell>{b.vendor_id}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-sm text-slate-500 flex h-32 items-center justify-center border rounded-md border-dashed">No data available. Please sync from Google Sheets.</div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="menu">
                    <Card>
                        <CardHeader>
                            <CardTitle>Master Menu POS</CardTitle>
                            <CardDescription>Daftar produk yang tersinkronisasi dari Point of Sales.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {menus.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Menu ID</TableHead>
                                            <TableHead>Nama Menu</TableHead>
                                            <TableHead>Outlet ID</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {menus.map(m => (
                                            <TableRow key={m.id}>
                                                <TableCell>{m.id}</TableCell>
                                                <TableCell>{m.nama_menu}</TableCell>
                                                <TableCell>{m.outlet_id}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-sm text-slate-500 flex h-32 items-center justify-center border rounded-md border-dashed">No data available. Please sync from Google Sheets.</div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="resep">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mapping Resep</CardTitle>
                            <CardDescription>Hubungan Menu POS dengan Bahan Baku dan jumlah pakainya.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {resep.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Resep ID</TableHead>
                                            <TableHead>Menu ID</TableHead>
                                            <TableHead>Bahan ID</TableHead>
                                            <TableHead>Jumlah Pakai</TableHead>
                                            <TableHead>Station</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {resep.map(r => (
                                            <TableRow key={r.id}>
                                                <TableCell>{r.id}</TableCell>
                                                <TableCell>{r.menu_id}</TableCell>
                                                <TableCell>{r.bahan_id}</TableCell>
                                                <TableCell>{r.jumlah_pakai}</TableCell>
                                                <TableCell>{r.station}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-sm text-slate-500 flex h-32 items-center justify-center border rounded-md border-dashed">No data available. Please sync from Google Sheets.</div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
