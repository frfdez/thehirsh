'use client'

import { useState } from 'react'
import { jsPDF } from 'jspdf'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Printer, Tag } from 'lucide-react'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'

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

  const handlePrint = async () => {
    if (!selectedTable) return

    // Nueva sección para registrar la venta
    try {
      const venta = {
        mesaId: selectedTable.id,
        items: selectedTable.items,
        subtotal: subtotal,
        descuento: discount,
        total: total,
        fecha: new Date(),
      }
      await addDoc(collection(db, 'ventas'), venta)
      console.log('Venta registrada exitosamente.')
    } catch (error) {
      console.error('Error al registrar la venta:', error)
    }

    // Código existente para generar la boleta
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("Boleta de venta", 20, 20)

    doc.setFontSize(12)
    doc.text(`Mesa: ${selectedTable.id}`, 20, 30)

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
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white">Checkout</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-300 block mb-1">
              Seleccionar Mesa
            </span>
            <Select onValueChange={handleTableSelect}>
              <SelectTrigger id="table-select" className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Seleccionar mesa" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {tables.map(table => (
                  <SelectItem key={table.id} value={table.id.toString()} className="text-white">
                    Mesa {table.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTable && (
            <div className="space-y-4">
              <Table className="border-gray-700">
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-700/50">
                    <TableHead className="text-gray-300">Ítem</TableHead>
                    <TableHead className="text-gray-300">Cantidad</TableHead>
                    <TableHead className="text-gray-300">Precio</TableHead>
                    <TableHead className="text-gray-300">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedTable.items.map((item, index) => (
                    <TableRow key={`${item.name}-${index}`} className="border-gray-700 hover:bg-gray-700/50">
                      <TableCell className="text-white">{item.name}</TableCell>
                      <TableCell className="text-white">{item.quantity}</TableCell>
                      <TableCell className="text-white">${(item.price * item.quantity).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/20"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar ítem</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="space-y-2">
                <p className="text-gray-300">Subtotal: <span className="font-semibold text-white">${subtotal.toFixed(2)}</span></p>
                <div className="flex items-center space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="text-gray-300 border-gray-600 hover:bg-gray-700">
                        <Tag className="mr-2 h-4 w-4" />
                        Aplicar Descuento
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-800 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Aplicar Descuento</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-gray-300 block mb-1">
                          Porcentaje de descuento
                        </span>
                        <Input
                          id="discount-input"
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
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 mt-1"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                  {discount > 0 && (
                    <p className="text-green-400">Descuento aplicado: {discount}%</p>
                  )}
                </div>
                <p className="text-xl font-bold text-white">Total: ${total.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      {selectedTable && (
        <CardFooter>
          <Button onClick={handlePrint} className="w-full bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white">
            <Printer className="mr-2 h-4 w-4" />
            Pagar cuenta
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}