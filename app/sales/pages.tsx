'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { collection, addDoc, getDocs } from "firebase/firestore"
import { db } from "../../firebase/firebaseConfig"
import { Plus, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react'

export default function Sales() {
  const [orders, setOrders] = useState<{ item: string, quantity: number, cost: number, id?: string }[]>([])
  const [newOrder, setNewOrder] = useState({ item: '', quantity: 0, cost: 0 })
  const [ventas, setVentas] = useState<any[]>([])
  const [topSellingItems, setTopSellingItems] = useState<{ name: string, quantity: number }[]>([])

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "orders"))
        const ordersData = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as { item: string, quantity: number, cost: number, id?: string }[]
        setOrders(ordersData)
      } catch (error) {
        console.error("Error al obtener los datos de órdenes: ", error)
      }
    }

    const fetchVentas = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "ventas"))
        const ventasData = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          fecha: doc.data().fecha.toDate(), // Convierte la fecha de Timestamp a Date
          items: doc.data().items || [], // Asegura que items esté presente
        }))
        setVentas(ventasData)

        // Procesar los datos para calcular los productos más vendidos
        const itemCounts: { [key: string]: number } = {}

        ventasData.forEach((venta) => {
          venta.items.forEach((item: any) => {
            if (itemCounts[item.name]) {
              itemCounts[item.name] += item.quantity
            } else {
              itemCounts[item.name] = item.quantity
            }
          })
        })

        const topItems = Object.keys(itemCounts).map((name) => ({
          name,
          quantity: itemCounts[name],
        }))

        // Ordenar los productos por cantidad vendida en orden descendente
        topItems.sort((a, b) => b.quantity - a.quantity)

        // Tomar los primeros N productos (por ejemplo, los top 5)
        setTopSellingItems(topItems.slice(0, 5))
      } catch (error) {
        console.error("Error al obtener las ventas: ", error)
      }
    }

    fetchOrders()
    fetchVentas()
  }, [])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-7xl mx-auto">

        {/* Sección de Más Vendidos */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white flex items-center">
              <TrendingUp className="w-6 h-6 mr-2" />
              Más Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="border-gray-700">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-300">Producto</TableHead>
                  <TableHead className="text-gray-300">Cantidad Vendida</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSellingItems.map((item) => (
                  <TableRow key={item.name} className="border-gray-700 hover:bg-gray-700/50">
                    <TableCell className="text-white">{item.name}</TableCell>
                    <TableCell className="text-white">{item.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white flex items-center justify-between">
              <span className="flex items-center">
                <DollarSign className="mr-2 h-6 w-6 text-green-500" />
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
                      onChange={(e) => {
                        const value = parseFloat(e.target.value)
                        if (value >= 0) {
                          setNewOrder({ ...newOrder, cost: value })
                        } else {
                          setNewOrder({ ...newOrder, cost: 0 })
                        }
                      }}
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order, index) => (
                  <TableRow key={index} className="border-gray-700 hover:bg-gray-700/50">
                    <TableCell className="text-white">{order.item}</TableCell>
                    <TableCell className="text-white">{order.quantity}</TableCell>
                    <TableCell className="text-white">${order.cost.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-4 text-xl font-bold text-white">Total gastado este mes: <span className="text-green-400">${totalSpent.toFixed(2)}</span></p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white flex items-center">
              <ShoppingCart className="w-6 h-6 mr-2" />
              Historial de Ventas
            </CardTitle>
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
                    <TableCell className="text-white">
                      {venta.fecha.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-white">{venta.mesaId}</TableCell>
                    <TableCell className="text-white">
                      {venta.items.map((item: any, index: number) => (
                        <div key={index}>
                          {item.quantity} x {item.name} (${item.price.toFixed(2)})
                        </div>
                      ))}
                    </TableCell>
                    <TableCell className="text-white">${venta.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}