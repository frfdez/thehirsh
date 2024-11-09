import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Minus } from 'lucide-react'


type Table = {
  id: number
  status: 'available' | 'occupied'
  items: { name: string, price: number, quantity: number }[]
}

type MenuItem = {
  id: number
  name: string
  price: number
  type: 'food' | 'drink'
}

type MenuTableProps = {
  table: Table
  onStatusChange: (newStatus: 'available' | 'occupied') => void
  onAddItem: (item: MenuItem) => void
  onRemoveItem: (itemIndex: number) => void
  menuItems: MenuItem[]
}

export default function MenuTable({ table, onStatusChange, onAddItem, onRemoveItem, menuItems }: MenuTableProps) {
  const [tableStatus, setTableStatus] = useState(table.status)

  const handleStatusChange = () => {
    const newStatus = tableStatus === 'available' ? 'occupied' : 'available'
    setTableStatus(newStatus)
    onStatusChange(newStatus)
  }
  return (
    <div>
      <Button onClick={handleStatusChange}>
        {tableStatus === 'available' ? 'Ocupar Mesa' : 'Desocupar Mesa'}
      </Button>
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
          {table.items.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>${item.price}</TableCell>
              <TableCell>
                <Button variant="outline" size="icon" onClick={() => onRemoveItem(index)}>
                  <Minus className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button>Agregar Ítem</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Menú</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              {menuItems.map(item => (
                <Button key={item.id} onClick={() => onAddItem(item)}>
                  {item.name} - ${item.price}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
