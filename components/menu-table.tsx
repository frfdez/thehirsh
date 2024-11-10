'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Table = {
  id: number
  status: 'available' | 'occupied'
  items: { name: string, price: number, quantity: number }[]
}

type MenuItem = {
  id: string
  name: string
  price: number
  type: 'food' | 'drink'
}

type MenuTableProps = {
  table: Table
  onStatusChange: () => void
  onAddItem: (item: MenuItem) => void
  onRemoveItem: (itemIndex: number) => void
  menuItems: MenuItem[] // Recibe los items de inventario desde Dashboard
}

export default function MenuTable({ table, onStatusChange, onAddItem, onRemoveItem, menuItems }: Readonly<MenuTableProps>) {
  const [tableStatus, setTableStatus] = useState(table.status)

  const handleStatusChange = () => {
    const newStatus = tableStatus === 'available' ? 'occupied' : 'available'
    setTableStatus(newStatus)
    onStatusChange()
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white flex justify-between items-center">
          Mesa {table.id}
          <Button
            onClick={handleStatusChange}
            variant="outline"
            className={`${tableStatus === 'available' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white border-transparent`}
          >
            {tableStatus === 'available' ? 'Ocupar Mesa' : 'Desocupar Mesa'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
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
            {table.items.map((item, index) => (
              <TableRow key={item.name} className="border-gray-700 hover:bg-gray-700/50">
                <TableCell className="text-white">{item.name}</TableCell>
                <TableCell className="text-white">{item.quantity}</TableCell>
                <TableCell className="text-white">${typeof item.price === 'number' ? item.price.toFixed(2) : 'N/A'}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveItem(index)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/20"
                  >
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Sección para agregar items del inventario */}
        <div className="mt-4">
          <h3 className="text-xl font-bold text-white mb-2">Agregar Ítem</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map(item => (
              <Button
                key={item.id}
                onClick={() => onAddItem(item)} // Agrega el item seleccionado a la mesa
                className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white"
              >
                {item.name} - ${typeof item.price === 'number' ? item.price.toFixed(2) : 'N/A'}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
