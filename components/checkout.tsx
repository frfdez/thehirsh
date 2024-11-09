import { useState } from 'react'
import { jsPDF } from 'jspdf'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type Table = {
  id: number
  status: 'available' | 'occupied'
  items: { name: string, price: number, quantity: number }[]
}

type CheckoutProps = {
  tables: Table[]
}

export default function Checkout({ tables }: CheckoutProps) {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [discount, setDiscount] = useState(0)

  const handleTableSelect = (tableId: string) => {
    const table = tables.find(t => t.id === parseInt(tableId))
    setSelectedTable(table || null)
  }

  const handleRemoveItem = (itemIndex: number) => {
    if (selectedTable) {
      const updatedItems = [...selectedTable.items]
      if (itemIndex >= 0 && itemIndex < updatedItems.length) {
        updatedItems.splice(itemIndex, 1)
        setSelectedTable({ ...selectedTable, items: updatedItems })
      }
    }
  }
  
  const subtotal = selectedTable?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) ?? 0
  const total = subtotal * (1 - discount / 100)

  const handlePrint = () => {
    if (!selectedTable) return

    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("Boleta de venta", 20, 20)

    doc.setFontSize(12)
    doc.text(`Mesa: ${selectedTable.id}`, 20, 30)
    //doc.text(`estado: ${selectedTable.status}`, 20, 40)

    let y = 50
    doc.text("Ítem", 20, y)
    y += 10

    selectedTable.items.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.name} - ${item.quantity} x $${item.price} = $${item.price * item.quantity}`, 20, y)
      y += 10
    })
    y += 10
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 20, y)
    y += 10
    doc.text(`Descuento: ${discount}%`, 20, y)
    y += 10
    doc.text(`Total: $${total.toFixed(2)}`, 20, y)

    window.open(doc.output('bloburl'), '_blank')
    console.log('Imprimiendo boleta...')
  }

  return (
    <div>
      <Select onValueChange={handleTableSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar mesa" />
        </SelectTrigger>
        <SelectContent>
          {tables.map(table => (
            <SelectItem key={table.id} value={table.id.toString()}>Mesa {table.id}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedTable && (
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ítem</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedTable.items.map((item, index) => (
                <TableRow key={`${item.name}-${index}`}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>${item.price * item.quantity}</TableCell>
                  <TableCell>
                    <Button variant="destructive" onClick={() => handleRemoveItem(index)}>Eliminar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4">
            <p>Subtotal: ${subtotal}</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Aplicar Descuento</Button>
              </DialogTrigger>
                <DialogContent>
                <DialogHeader>
                  <DialogTitle>Aplicar Descuento</DialogTitle>
                </DialogHeader>
                <Input
                  type="number"
                  placeholder="Porcentaje de descuento"
                  value={discount || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value)
                    if (value >= 0 && value <= 100) {
                      setDiscount(value)
                    } else {
                      setDiscount(0)
                    }
                  }}
                />
                </DialogContent>
            </Dialog>
            <p className="font-bold">Total: ${total.toFixed(2)}</p>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handlePrint}>Pagar cuenta</Button>
          </div>
        </div>
      )}
    </div>
  )
}
