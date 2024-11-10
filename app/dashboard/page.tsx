'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut } from 'lucide-react'
import { collection, getDocs } from "firebase/firestore"
import { db } from "../../firebase/firebaseConfig"

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
  id: string
  name: string
  price: number
  type: 'food' | 'drink'
}

export default function Dashboard() {
  // Estados
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [tables, setTables] = useState<Table[]>(Array(12).fill(null).map((_, i) => ({ id: i + 1, status: 'available', items: [] })))
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [inventoryItems, setInventoryItems] = useState<MenuItem[]>([]) // Estado para el inventario

  // Efecto para verificar el inicio de sesión e inventario
  useEffect(() => {
    const loggedIn = localStorage.getItem('loggedIn') === 'true'
    const username = localStorage.getItem('username') ?? ''
    if (loggedIn) {
      setLoggedIn(true)
      setUsername(username)
    }

    // Obtener los elementos del inventario
    const fetchInventory = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "inventory"))
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MenuItem[]
        setInventoryItems(items) // Asignar los datos al estado de inventario
      } catch (error) {
        console.error("Error al obtener inventario:", error)
      }
    }

    fetchInventory()
  }, [])

  // Funciones para manejar el login y logout
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

  // Función para seleccionar una mesa
  const handleTableSelect = (table: Table) => {
    setSelectedTable(table)
  }

  // Cambiar el estado de la mesa entre disponible y ocupada
  const handleTableStatusChange = (tableId: number) => {
    setTables(tables.map(table => 
      table.id === tableId 
        ? { ...table, status: table.status === 'available' ? 'occupied' : 'available' } 
        : table
    ))
  }

  // Función para agregar un ítem a la mesa seleccionada
  const handleAddItem = (item: MenuItem) => {
    if (selectedTable) {
      const existingItemIndex = selectedTable.items.findIndex(i => i.name === item.name)
      let updatedItems

      // Si el ítem ya existe en la mesa, incrementa la cantidad
      if (existingItemIndex !== -1) {
        updatedItems = selectedTable.items.map((existingItem, index) =>
          index === existingItemIndex
            ? { ...existingItem, quantity: existingItem.quantity + 1 }
            : existingItem
        )
      } else {
        // Si no existe, lo agrega con una cantidad inicial de 1
        updatedItems = [...selectedTable.items, { name: item.name, price: item.price, quantity: 1 }]
      }

      const updatedTable = { ...selectedTable, items: updatedItems }
      setTables(tables.map(table => table.id === selectedTable.id ? updatedTable : table))
      setSelectedTable(updatedTable)
    }
  }

  // Función para eliminar un ítem de la mesa seleccionada
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
            Bienvenido, {username}
          </h1>
          <Button onClick={handleLogout} variant="outline" className="text-black border-white hover:bg-gray hover:text-gray-900">
            <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
          </Button>
        </div>
        <Tabs defaultValue="tables" className="space-y-6">
          <TabsList className="bg-gray-800 p-1 rounded-lg">
            <TabsTrigger value="tables" className="data-[state=active]:bg-gray-700">Mesas</TabsTrigger>
            <TabsTrigger value="inventory" className="data-[state=active]:bg-gray-700">Inventario</TabsTrigger>
            <TabsTrigger value="sales" className="data-[state=active]:bg-gray-700">Ventas/Restock</TabsTrigger>
          </TabsList>
          <TabsContent value="tables">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tables.map(table => (
                <Card key={table.id} className={`bg-gray-800 border-gray-700 transition-all duration-300 ${table.status === 'occupied' ? 'border-pink-500 shadow-lg shadow-pink-500/20' : ''}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg font-medium">Mesa {table.id}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`mb-4 ${table.status === 'available' ? 'text-green-400' : 'text-pink-400'}`}>
                      {table.status === 'available' ? 'Disponible' : 'Ocupada'}
                    </p>
                    <Button onClick={() => handleTableSelect(table)} variant="secondary" className="w-full">
                      Seleccionar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="mt-8 bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600">
                  Checkout
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 text-white">
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
            <DialogContent className="bg-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>Mesa {selectedTable.id}</DialogTitle>
              </DialogHeader>
              <MenuTable
                table={selectedTable}
                onStatusChange={() => handleTableStatusChange(selectedTable.id)}
                onAddItem={handleAddItem}
                onRemoveItem={handleRemoveItem}
                menuItems={inventoryItems} // Pasar los items de inventario a MenuTable
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
