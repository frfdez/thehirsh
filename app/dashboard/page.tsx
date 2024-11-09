'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Minus, Utensils, Coffee } from 'lucide-react'

// Componentes adicionales que necesitaremos
import Login from '../../components/login'
import MenuTable from '../../components/menu-table'
import Inventory from '../inventory/pages'
import Sales from '../sales/pages'
import Checkout from '../../components/checkout'

// Tipos
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

export default function Dashboard() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [tables, setTables] = useState<Table[]>(Array(12).fill(null).map((_, i) => ({ id: i + 1, status: 'available', items: [] })))
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [menuItems] = useState<MenuItem[]>([
    { id: 1, name: 'Hamburguesa', price: 10, type: 'food' },
    { id: 2, name: 'Pizza', price: 12, type: 'food' },
    { id: 3, name: 'Ensalada', price: 8, type: 'food' },
    { id: 4, name: 'Refresco', price: 2, type: 'drink' },
    { id: 5, name: 'Cerveza', price: 4, type: 'drink' },
    { id: 6, name: 'Agua', price: 1, type: 'drink' },
  ])

  useEffect(() => {
    const loggedIn = localStorage.getItem('loggedIn') === 'true'
    const username = localStorage.getItem('username') || ''
    if (loggedIn) {
      setLoggedIn(true)
      setUsername(username)
    }
  }, [])

  const handleLogin = (user: string) => {
    setLoggedIn(true)
    setUsername(user)
    localStorage.setItem('loggedIn', 'true')
    localStorage.setItem('username', user)
  }

  const handleLogout = () => {
    setLoggedIn(false)
    setUsername('')
    localStorage.removeItem('loggedIn')
    localStorage.removeItem('username')
  }

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table)
  }

  const handleTableStatusChange = (tableId: number) => {
    setTables(tables.map(table => 
      table.id === tableId 
        ? { ...table, status: table.status === 'available' ? 'occupied' : 'available' } 
        : table
    ))
  }

  const handleAddItem = (item: MenuItem) => {
    if (selectedTable) {
      const updatedTable = {
        ...selectedTable,
        items: [
          ...selectedTable.items,
          { name: item.name, price: item.price, quantity: 1 }
        ]
      }
      setTables(tables.map(table => table.id === selectedTable.id ? updatedTable : table))
      setSelectedTable(updatedTable)
    }
  }

  const handleRemoveItem = (itemIndex: number) => {
    if (selectedTable) {
      const updatedItems = [...selectedTable.items]
      if (itemIndex >= 0 && itemIndex < updatedItems.length) {
        updatedItems.splice(itemIndex, 1)
      }
      const updatedTable = { ...selectedTable, items: updatedItems }
      setTables(tables.map(table => table.id === selectedTable.id ? updatedTable : table))
      setSelectedTable(updatedTable)
    }
  }

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-2xl font-bold">Bienvenido, {username}</h1>
      <Button onClick={handleLogout}>Cerrar sesión</Button>
    </div>
      <Tabs defaultValue="tables">
        <TabsList>
          <TabsTrigger value="tables">Mesas</TabsTrigger>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
          <TabsTrigger value="sales">Ventas/Restock</TabsTrigger>
        </TabsList>
        <TabsContent value="tables">
          <div className="grid grid-cols-3 gap-4">
            {tables.map(table => (
              <Card key={table.id} className={table.status === 'occupied' ? 'bg-blue-100' : ''}>
                <CardHeader>
                  <CardTitle>Mesa {table.id}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Estado: {table.status === 'available' ? 'Disponible' : 'Ocupada'}</p>
                  <Button onClick={() => handleTableSelect(table)}>Seleccionar</Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="mt-4">Checkout</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Checkout</DialogTitle>
              </DialogHeader>
              <Checkout tables={tables.filter(table => table.status === 'occupied')} />
            </DialogContent>
          </Dialog>
        </TabsContent>
        <TabsContent value="inventory">
          <Inventory />
        </TabsContent>
        <TabsContent value="sales">
          <Sales />
        </TabsContent>
      </Tabs>
      {selectedTable && (
        <Dialog open={!!selectedTable} onOpenChange={() => setSelectedTable(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mesa {selectedTable.id}</DialogTitle>
            </DialogHeader>
            <MenuTable
              table={selectedTable}
              onStatusChange={() => handleTableStatusChange(selectedTable.id)}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              menuItems={menuItems}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}