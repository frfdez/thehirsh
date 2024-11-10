'use client'

import { ReactNode, useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "../../firebase/firebaseConfig"
import { MoreVertical, Edit2, Trash2, Plus, Package } from 'lucide-react'

type InventoryItem = {
  id: string
  price: number
  name: string
  quantity: number
}

export default function Inventory() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [newPrice, setNewPrice] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [newItemName, setNewItemName] = useState("")
  const [newItemQuantity, setNewItemQuantity] = useState(0)
  const [newItemPrice, setNewItemPrice] = useState(0)

  useEffect(() => {
    const fetchInventoryItems = async () => {
      setLoading(true)
      try {
        const querySnapshot = await getDocs(collection(db, "inventory"))
        const items = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as InventoryItem[]
        setInventoryItems(items)
      } catch (error) {
        console.error("Error al obtener los datos de inventario: ", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInventoryItems()
  }, [])

  const addInventoryItem = async () => {
    if (newItemName && newItemQuantity > 0 && newItemPrice >= 0) {
      try {
        const inventoryItem = {
          name: newItemName,
          quantity: newItemQuantity,
          price: newItemPrice,
        }
        const itemRef = await addDoc(collection(db, "inventory"), inventoryItem)
        setInventoryItems([...inventoryItems, { ...inventoryItem, id: itemRef.id }])
        setNewItemName('')
        setNewItemQuantity(0)
        setNewItemPrice(0)
        alert("Ítem agregado exitosamente al inventario!")
      } catch (error) {
        console.error("Error añadiendo ítem al inventario: ", error)
        alert("No se pudo agregar el ítem. Verifica las reglas de Firestore o la conexión.")
      }
    } else {
      alert("Todos los campos son obligatorios y deben tener valores válidos.")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "inventory", id))
      setInventoryItems(inventoryItems.filter(item => item.id !== id))
    } catch (error) {
      console.error("Error eliminando documento: ", error)
    }
  }

  const handleEditPrice = (item: InventoryItem) => {
    setEditingItem(item)
    setNewPrice(item.price)
    setMenuOpen(null)
  }

  const handleSavePrice = async () => {
    if (editingItem && newPrice !== null) {
      try {
        const itemRef = doc(db, "inventory", editingItem.id)
        await updateDoc(itemRef, { price: newPrice })
        setInventoryItems(inventoryItems.map(item => 
          item.id === editingItem.id ? { ...item, price: newPrice } : item
        ))
        setEditingItem(null)
        setNewPrice(null)
        console.log("Precio actualizado")
      } catch (error) {
        console.error("Error actualizando precio: ", error)
      }
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white flex justify-between items-center">
          Inventario
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Ítem
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white">Agregar Nuevo Ítem al Inventario</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <Input
                  placeholder="Nombre del Ítem"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
                <Input
                  type="number"
                  placeholder="Cantidad"
                  value={newItemQuantity || ''}
                  onChange={(e) => setNewItemQuantity(parseInt(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
                <Input
                  type="number"
                  placeholder="Precio"
                  value={newItemPrice || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value)
                    if (value >= 0) {
                      setNewItemPrice(value)
                    } else {
                      setNewItemPrice(0)
                    }
                  }}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
                <Button onClick={addInventoryItem} className="w-full bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white">
                  Agregar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-white">Cargando inventario...</p>
        ) : (
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
              {inventoryItems.map((item) => (
                <TableRow key={item.id} className="border-gray-700 hover:bg-gray-700/50">
                  <TableCell className="text-white">{item.name}</TableCell>
                  <TableCell className="text-white">{item.quantity}</TableCell>
                  <TableCell className="text-white">${Number(item.price).toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="relative">
                      <Button variant="ghost" size="icon" onClick={() => setMenuOpen(menuOpen === item.id ? null : item.id)}>
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </Button>
                      {menuOpen === item.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-gray-700 border border-gray-600 rounded shadow-lg z-10">
                          <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-600" onClick={() => handleEditPrice(item)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Modificar Precio
                          </Button>
                          <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-600" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>                
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {editingItem && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
          <Card className="bg-gray-800 border-gray-700 w-96">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">Modificar Precio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input 
                type="number" 
                value={newPrice ?? ''} 
                onChange={(e) => setNewPrice(parseFloat(e.target.value))} 
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <div className="flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setEditingItem(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleSavePrice} className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white">
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  )
}