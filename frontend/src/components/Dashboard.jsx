import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Wifi, 
  WifiOff, 
  LogOut, 
  RefreshCw,
  AlertTriangle,
  User,
  Activity
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'sonner'

export default function Dashboard() {
  const [sensorData, setSensorData] = useState([])
  const [latestData, setLatestData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [stats, setStats] = useState(null)
  
  const { user, logout, token, API_BASE } = useAuth()

  useEffect(() => {
    fetchSensorData()
    const interval = setInterval(fetchSensorData, 10000) // Actualizar cada 10 segundos
    return () => clearInterval(interval)
  }, [])

  const fetchSensorData = async () => {
    try {
      const response = await fetch(`${API_BASE}/sensors?limit=20`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.datos.length > 0) {
          setSensorData(data.data.datos)
          setLatestData(data.data.datos[0])
          setStats(data.data.estadisticas)
          setConnected(true)
          
          // Verificar alertas en el último dato
          checkAlerts(data.data.datos[0])
        } else {
          setConnected(false)
        }
      } else {
        setConnected(false)
      }
    } catch (error) {
      console.error('Error fetching sensor data:', error)
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }

  const checkAlerts = (data) => {
    const newAlerts = []
    
    if (data.temperatura > 35) {
      newAlerts.push({
        type: 'temperature',
        message: `Temperatura alta: ${data.temperatura}°C`,
        level: 'warning'
      })
    }
    
    if (data.humedad > 80) {
      newAlerts.push({
        type: 'humidity',
        message: `Humedad alta: ${data.humedad}%`,
        level: 'warning'
      })
    }
    
    if (data.gas > 500) {
      newAlerts.push({
        type: 'gas',
        message: `Nivel de gas alto: ${data.gas}`,
        level: 'danger'
      })
    }
    
    setAlerts(newAlerts)
  }

  const handleLogout = async () => {
    await logout()
    toast.success("Sesión cerrada", {
      description: "Has cerrado sesión exitosamente",
    })
  }

  const formatChartData = () => {
    return sensorData.slice(0, 10).reverse().map(item => ({
      time: new Date(item.fecha_registro).toLocaleTimeString(),
      temperatura: parseFloat(item.temperatura),
      humedad: parseFloat(item.humedad),
      gas: parseInt(item.gas)
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard ESP32</h1>
          <p className="text-muted-foreground">Monitoreo de sensores en tiempo real</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span className="text-sm">{user?.nombre}</span>
            <Badge variant={user?.rol === 'admin' ? 'default' : 'secondary'}>
              {user?.rol}
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSensorData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
        </div>
      </div>

      {/* Estado de conexión */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            {connected ? (
              <>
                <Wifi className="h-5 w-5 text-green-500" />
                <span className="text-green-500 font-medium">ESP32 Conectado</span>
                {latestData && (
                  <span className="text-muted-foreground text-sm">
                    Última actualización: {new Date(latestData.fecha_registro).toLocaleString()}
                  </span>
                )}
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-red-500" />
                <span className="text-red-500 font-medium">ESP32 Desconectado</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant={alert.level === 'danger' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Datos de sensores en tiempo real */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temperatura</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestData ? `${latestData.temperatura}°C` : '--'}
            </div>
            {stats && (
              <p className="text-xs text-muted-foreground">
                Promedio 24h: {stats.temp_promedio}°C
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Humedad</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestData ? `${latestData.humedad}%` : '--'}
            </div>
            {stats && (
              <p className="text-xs text-muted-foreground">
                Promedio 24h: {stats.hum_promedio}%
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gas</CardTitle>
            <Wind className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestData ? latestData.gas : '--'}
            </div>
            {stats && (
              <p className="text-xs text-muted-foreground">
                Promedio 24h: {stats.gas_promedio}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico histórico */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Historial de Sensores</span>
          </CardTitle>
          <CardDescription>
            Últimas 10 lecturas de sensores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sensorData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formatChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="temperatura" 
                  stroke="#ef4444" 
                  name="Temperatura (°C)"
                  strokeWidth={2}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="humedad" 
                  stroke="#3b82f6" 
                  name="Humedad (%)"
                  strokeWidth={2}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="gas" 
                  stroke="#f59e0b" 
                  name="Gas"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              No hay datos disponibles
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas (Últimas 24 horas)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total registros</p>
                <p className="font-medium">{stats.total_registros}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Temp. máxima</p>
                <p className="font-medium">{stats.temp_maxima}°C</p>
              </div>
              <div>
                <p className="text-muted-foreground">Humedad máxima</p>
                <p className="font-medium">{stats.hum_maxima}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Gas máximo</p>
                <p className="font-medium">{stats.gas_maximo}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

