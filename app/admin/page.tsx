'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "../../firebase/firebaseConfig"
import { Plus, Trash2, Users, Package, DollarSign, LogOut, ShoppingCart } from 'lucide-react'
import Login from '../../components/login'

// Tipos de datos
type Employee = {
  id: string
  name: string
  role: string
}

type InventoryItem = {
  id: string
  name: string
  quantity: number
  price: number
}

type Sale = {
  id: string
  item: string
  quantity: number
  total: number
}

type Order = {
  id: string
  item: string
  quantity: number
  cost: number
}

type Venta = {
  id: string
  fecha: Date
  mesaId: number
  items: { name: string, price: number, quantity: number }[]
  total: number
}

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [ventas, setVentas] = useState<Venta[]>([])
  const [newEmployee, setNewEmployee] = useState({ name: '', role: '' })
  const [newInventoryItem, setNewInventoryItem] = useState({ name: '', quantity: 0, price: 0 })
  const [newOrder, setNewOrder] = useState({ item: '', quantity: 0, cost: 0 })

  useEffect(() => {
    const fetchData = async () => {
      const employeesData = await fetchCollection<Employee>("employees")
      const inventoryData = await fetchCollection<InventoryItem>("inventory")
      const salesData = await fetchCollection<Sale>("sales")
      const ordersData = await fetchCollection<Order>("orders")
      const loggedIn = localStorage.getItem('loggedIn') === 'true'
      if (loggedIn) {
        setLoggedIn(true)
      }

      setEmployees(employeesData)
      setInventory(inventoryData)
      setSales(salesData)
      setOrders(ordersData)
    }

    fetchData()
    fetchVentas()
  }, [])

  const fetchVentas = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "ventas"))
      const ventasData = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        fecha: doc.data().fecha.toDate(), // Convierte la fecha de Timestamp a Date
      })) as Venta[]
      setVentas(ventasData)
    } catch (error) {
      console.error("Error al obtener las ventas: ", error)
    }
  }
  
  const handleLogin = (user: string) => {
    setLoggedIn(true)
    localStorage.setItem('loggedIn', 'true')
    localStorage.setItem('username', user)
  }

  const fetchCollection = async <T extends { id: string }>(collectionName: string): Promise<T[]> => {
    const querySnapshot = await getDocs(collection(db, collectionName))
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T))
  }

  const handleAddEmployee = async () => {
    if (newEmployee.name && newEmployee.role) {
      const docRef = await addDoc(collection(db, "employees"), newEmployee)
      setEmployees([...employees, { ...newEmployee, id: docRef.id }])
      setNewEmployee({ name: '', role: '' })
    }
  }

  const handleDeleteEmployee = async (id: string) => {
    await deleteDoc(doc(db, "employees", id))
    setEmployees(employees.filter(employee => employee.id !== id))
  }

  const handleAddInventoryItem = async () => {
    if (newInventoryItem.name && newInventoryItem.quantity > 0 && newInventoryItem.price > 0) {
      const docRef = await addDoc(collection(db, "inventory"), newInventoryItem)
      setInventory([...inventory, { ...newInventoryItem, id: docRef.id }])
      setNewInventoryItem({ name: '', quantity: 0, price: 0 })
    }
  }

  const handleDeleteInventoryItem = async (id: string) => {
    await deleteDoc(doc(db, "inventory", id))
    setInventory(inventory.filter(item => item.id !== id))
  }

  const handleAddOrder = async () => {
    if (newOrder.item && newOrder.quantity > 0 && newOrder.cost > 0) {
      try {
        const orderRef = await addDoc(collection(db, "orders"), newOrder)
        const inventoryItem = {
          name: newOrder.item,
          price: newOrder.cost,
          quantity: newOrder.quantity,
        }
        await addDoc(collection(db, "inventory"), inventoryItem)
        setOrders([...orders, { ...newOrder, id: orderRef.id }])
        setNewOrder({ item: '', quantity: 0, cost: 0 })
        alert("Pedido añadido exitosamente a Firestore en ambas colecciones!")
      } catch (error) {
        console.error("Error añadiendo pedido: ", error)
        alert("No se pudo añadir el pedido. Verifica las reglas de Firestore o la conexión.")
      }
    } else {
      alert("Todos los campos son obligatorios y deben tener valores válidos.")
    }
  }
  

  const totalSpent = orders.reduce((sum, order) => sum + (order.cost * order.quantity), 0)

  const handleLogout = () => {
    setLoggedIn(false)
    localStorage.removeItem('loggedIn')
    localStorage.removeItem('username')
  }

  const handleDeleteOrder = async (index: number) => {
    const orderToDelete = orders[index];
  
    // Suponiendo que cada pedido tiene un campo 'id' con el ID del documento en Firebase
    const orderDocRef = doc(db, 'orders', orderToDelete.id);
  
    // Elimina el documento de Firebase
    await deleteDoc(orderDocRef);
  
    // Actualiza el estado local
    const updatedOrders = orders.filter((_, i) => i !== index);
    setOrders(updatedOrders);
  };

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <Button onClick={handleLogout} variant="outline" className="text-black border-white hover:bg-white hover:text-gray-900">
          <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
        </Button>
      </div>


      <Tabs defaultValue="employees" className="space-y-6">
        <TabsList className="text-white bg-gray-800 p-1 rounded-lg">
          <TabsTrigger value="employees" className="data-[state=active]:bg-gray-700">
            <Users className="mr-2 h-4 w-4" />
            Empleados
          </TabsTrigger>
          <TabsTrigger value="inventory" className="data-[state=active]:bg-gray-700">
            <Package className="mr-2 h-4 w-4" />
            Inventario
          </TabsTrigger>
          <TabsTrigger value="sales" className="data-[state=active]:bg-gray-700">
            <DollarSign className="mr-2 h-4 w-4" />
            Ventas
          </TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:bg-gray-700">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Pedidos al Proveedor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <Card className="text-white bg-gray-800 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Agregar Empleado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="text"
                placeholder="Nombre"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <Input
                type="text"
                placeholder="Rol"
                value={newEmployee.role}
                onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <Button onClick={handleAddEmployee} className="w-full bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Empleado
              </Button>
            </CardContent>
          </Card>
          <Card className="text-white bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Lista de Empleados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table className="border-gray-700">
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-700/50">
                    <TableHead className="text-gray-300">Nombre</TableHead>
                    <TableHead className="text-gray-300">Rol</TableHead>
                    <TableHead className="text-gray-300">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map(employee => (
                    <TableRow key={employee.id} className="border-gray-700 hover:bg-gray-700/50">
                      <TableCell className="text-white">{employee.name}</TableCell>
                      <TableCell className="text-white">{employee.role}</TableCell>
                      <TableCell>
                        <Button onClick={() => handleDeleteEmployee(employee.id)} variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-400/20">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar empleado</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="inventory">
          <Card className="text-white bg-gray-800 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Agregar Item de Inventario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="text"
                placeholder="Nombre"
                value={newInventoryItem.name}
                onChange={(e) => setNewInventoryItem({ ...newInventoryItem, name: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <Input
                type="number"
                placeholder="Cantidad"
                value={newInventoryItem.quantity || ''}
                onChange={(e) => setNewInventoryItem({ ...newInventoryItem, quantity: Number(e.target.value) })}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <Input
                type="number"
                placeholder="Precio"
                value={newInventoryItem.price || ''}
                onChange={(e) => setNewInventoryItem({ ...newInventoryItem, price: Number(e.target.value) })}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <Button onClick={handleAddInventoryItem} className="w-full bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Item
              </Button>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-xl font-semibold">Lista de Inventario</CardTitle>
            </CardHeader>
            <CardContent>
              <Table className="border-gray-700">
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-700/50">
                    <TableHead className="text-gray-300">Nombre</TableHead>
                    <TableHead className="text-gray-300">Cantidad</TableHead>
                    <TableHead className="text-gray-300">Precio</TableHead>
                    <TableHead className="text-gray-300">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map(item => (
                    <TableRow key={item.id} className="border-gray-700 hover:bg-gray-700/50">
                      <TableCell className="text-white">{item.name}</TableCell>
                      <TableCell className="text-white">{item.quantity}</TableCell>
                      <TableCell className="text-white">${Number(item.price).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button onClick={() => handleDeleteInventoryItem(item.id)} variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-400/20">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar item</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="sales">
          <Card className="text-white bg-gray-800 border-gray-700">
            <CardHeader>
            <CardTitle className="text-xl font-semibold">Lista de Ventas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table className="border-gray-700">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-300">Fecha</TableHead>
                    <TableHead className="text-gray-300">Mesa</TableHead>
                    <TableHead className="text-gray-300">Ítems</TableHead>
                    <TableHead className="text-gray-300">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ventas.map((venta) => (
                    <TableRow key={venta.id} className="border-gray-700 hover:bg-gray-700/50">
                      <TableCell>{venta.fecha.toLocaleString()}</TableCell>
                      <TableCell>{venta.mesaId}</TableCell>
                      <TableCell>
                        {venta.items.map((item, index) => (
                          <div key={index}>
                            {item.quantity} x {item.name} (${item.price.toFixed(2)})
                          </div>
                        ))}
                      </TableCell>
                      <TableCell>${venta.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
{/* Pestaña de Pedidos al Proveedor */}
<TabsContent value="orders">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white flex items-center justify-between">
                <span className="flex items-center">
                  <ShoppingCart className="mr-2 h-6 w-6 text-pink-500" />
                  Pedidos al Proveedor
                </span>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Nuevo Pedido
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-800 border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold text-white">Nuevo Pedido al Proveedor</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4">
                      <Input
                        placeholder="Ítem"
                        value={newOrder.item}
                        onChange={(e) => setNewOrder({ ...newOrder, item: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      />
                      <Input
                        type="number"
                        placeholder="Cantidad"
                        value={newOrder.quantity || ''}
                        onChange={(e) => setNewOrder({ ...newOrder, quantity: parseInt(e.target.value) })}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      />
                      <Input
                        type="number"
                        placeholder="Costo"
                        value={newOrder.cost || ''}
                        onChange={(e) => setNewOrder({ ...newOrder, cost: parseFloat(e.target.value) })}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      />
                      <Button onClick={handleAddOrder} className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white">
                        Agregar Pedido
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table className="border-gray-700">
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-700/50">
                    <TableHead className="text-gray-300">Ítem</TableHead>
                    <TableHead className="text-gray-300">Cantidad</TableHead>
                    <TableHead className="text-gray-300">Costo</TableHead>
                    <TableHead className="text-gray-300">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order, index) => (
                    <TableRow key={index} className="border-gray-700 hover:bg-gray-700/50">
                      <TableCell className="text-white">{order.item}</TableCell>
                      <TableCell className="text-white">{order.quantity}</TableCell>
                      <TableCell className="text-white">${order.cost.toFixed(2)}</TableCell>
                      <TableCell className="text-white">
                        <Button
                          onClick={() => handleDeleteOrder(index)}
                          className="bg-red-500 hover:bg-red-600 text-white"
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-4 text-xl font-bold text-white">
                Total gastado este mes: <span className="text-green-400">${totalSpent.toFixed(2)}</span>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}