"""
Примеры типового оборудования системы безопасности
"""
from app.models import Device
from app.models.device import DeviceType, PortType


# КАМЕРЫ
CAMERA_HIKVISION_4K = Device(
    name="Hikvision DS-2CD2143G2-I",
    device_type=DeviceType.CAMERA,
    model="DS-2CD2143G2-I",
    manufacturer="Hikvision",
    resolution="4K (8MP)",
    power_consumption_watts=10,
    bandwidth_requires_mbps=8,
)
CAMERA_HIKVISION_4K.add_port("ETH1", PortType.ETHERNET, speed_mbps=1000)
CAMERA_HIKVISION_4K.add_port("POE", PortType.POWER, power_watts=12)

CAMERA_DAHUA_2K = Device(
    name="Dahua IPC-HDBW2431E",
    device_type=DeviceType.CAMERA,
    model="IPC-HDBW2431E",
    manufacturer="Dahua",
    resolution="2K (4MP)",
    power_consumption_watts=8,
    bandwidth_requires_mbps=5,
)
CAMERA_DAHUA_2K.add_port("ETH1", PortType.ETHERNET, speed_mbps=1000)
CAMERA_DAHUA_2K.add_port("POE", PortType.POWER, power_watts=9.6)

CAMERA_UNIVIEW_1080P = Device(
    name="Uniview IPC322SR",
    device_type=DeviceType.CAMERA,
    model="IPC322SR",
    manufacturer="Uniview",
    resolution="1080p (2MP)",
    power_consumption_watts=5,
    bandwidth_requires_mbps=3,
)
CAMERA_UNIVIEW_1080P.add_port("ETH1", PortType.ETHERNET, speed_mbps=1000)
CAMERA_UNIVIEW_1080P.add_port("POE", PortType.POWER, power_watts=6)


# КОММУТАТОРЫ
SWITCH_CISCO_48POE = Device(
    name="Cisco Catalyst 2960X-48TS-L",
    device_type=DeviceType.SWITCH,
    model="C2960X-48TS-L",
    manufacturer="Cisco",
    power_consumption_watts=150,
)
for i in range(1, 49):
    SWITCH_CISCO_48POE.add_port(f"GigabitEthernet 1/0/{i}", PortType.ETHERNET, speed_mbps=1000)
SWITCH_CISCO_48POE.add_port("PS1", PortType.POWER, power_watts=500)
SWITCH_CISCO_48POE.add_port("PS2", PortType.POWER, power_watts=500)

SWITCH_HIKVISION_24POE = Device(
    name="Hikvision DS-3E0524P-E",
    device_type=DeviceType.SWITCH,
    model="DS-3E0524P-E",
    manufacturer="Hikvision",
    power_consumption_watts=90,
)
for i in range(1, 25):
    SWITCH_HIKVISION_24POE.add_port(f"GE {i}", PortType.ETHERNET, speed_mbps=1000)
SWITCH_HIKVISION_24POE.add_port("PS", PortType.POWER, power_watts=120)

SWITCH_NETGEAR_16POE = Device(
    name="Netgear PoE+ Smart Managed Pro Switch",
    device_type=DeviceType.SWITCH,
    model="GS716Pv3",
    manufacturer="Netgear",
    power_consumption_watts=65,
)
for i in range(1, 17):
    SWITCH_NETGEAR_16POE.add_port(f"Port {i}", PortType.ETHERNET, speed_mbps=1000)
SWITCH_NETGEAR_16POE.add_port("Power", PortType.POWER, power_watts=180)


# СЕРВЕРЫ И NVR
NVR_HIKVISION_32CH = Device(
    name="Hikvision DS-7632NI-K2",
    device_type=DeviceType.NVR,
    model="DS-7632NI-K2",
    manufacturer="Hikvision",
    storage_capacity_gb=4000,
    power_consumption_watts=300,
)
NVR_HIKVISION_32CH.add_port("ETH1", PortType.ETHERNET, speed_mbps=1000)
NVR_HIKVISION_32CH.add_port("ETH2", PortType.ETHERNET, speed_mbps=1000)
NVR_HIKVISION_32CH.add_port("USB 1", PortType.SERIAL)
NVR_HIKVISION_32CH.add_port("Power", PortType.POWER, power_watts=500)

SERVER_DELL_R750 = Device(
    name="Dell PowerEdge R750",
    device_type=DeviceType.SERVER,
    model="PowerEdge R750",
    manufacturer="Dell",
    storage_capacity_gb=8000,
    power_consumption_watts=500,
)
SERVER_DELL_R750.add_port("ETH1", PortType.ETHERNET, speed_mbps=10000)
SERVER_DELL_R750.add_port("ETH2", PortType.ETHERNET, speed_mbps=10000)
SERVER_DELL_R750.add_port("IPMI", PortType.ETHERNET, speed_mbps=1000)
SERVER_DELL_R750.add_port("Power 1", PortType.POWER, power_watts=1000)
SERVER_DELL_R750.add_port("Power 2", PortType.POWER, power_watts=1000)


# КОНТРОЛЛЕРЫ ДОСТУПА
ACCESS_CONTROLLER_HIKVISION = Device(
    name="Hikvision DS-K2604T",
    device_type=DeviceType.ACCESS_CONTROLLER,
    model="DS-K2604T",
    manufacturer="Hikvision",
    power_consumption_watts=50,
)
ACCESS_CONTROLLER_HIKVISION.add_port("ETH1", PortType.ETHERNET, speed_mbps=100)
ACCESS_CONTROLLER_HIKVISION.add_port("RS485", PortType.SERIAL)
ACCESS_CONTROLLER_HIKVISION.add_port("Power", PortType.POWER, power_watts=60)

ACCESS_CONTROLLER_ZKTECO = Device(
    name="ZKTeco ProCapture EC220",
    device_type=DeviceType.ACCESS_CONTROLLER,
    model="ProCapture EC220",
    manufacturer="ZKTeco",
    power_consumption_watts=40,
)
ACCESS_CONTROLLER_ZKTECO.add_port("ETH1", PortType.ETHERNET, speed_mbps=100)
ACCESS_CONTROLLER_ZKTECO.add_port("RS485", PortType.SERIAL)
ACCESS_CONTROLLER_ZKTECO.add_port("Power", PortType.POWER, power_watts=50)


# UPS
UPS_APC_5KVA = Device(
    name="APC Smart-UPS 5000VA",
    device_type=DeviceType.UPS,
    model="SUA5000RMI5U",
    manufacturer="APC",
    power_consumption_watts=5000,
)
UPS_APC_5KVA.add_port("RS232", PortType.SERIAL)
UPS_APC_5KVA.add_port("Ethernet", PortType.ETHERNET, speed_mbps=10)
UPS_APC_5KVA.add_port("Input", PortType.POWER, power_watts=5000)
UPS_APC_5KVA.add_port("Output", PortType.POWER, power_watts=5000)


# Словарь всех доступных моделей
EQUIPMENT_CATALOG = {
    # Камеры
    "hikvision-4k": CAMERA_HIKVISION_4K,
    "dahua-2k": CAMERA_DAHUA_2K,
    "uniview-1080p": CAMERA_UNIVIEW_1080P,
    
    # Коммутаторы
    "cisco-48poe": SWITCH_CISCO_48POE,
    "hikvision-24poe": SWITCH_HIKVISION_24POE,
    "netgear-16poe": SWITCH_NETGEAR_16POE,
    
    # Серверы
    "nvr-hikvision-32ch": NVR_HIKVISION_32CH,
    "server-dell-r750": SERVER_DELL_R750,
    
    # Контроллеры доступа
    "access-hikvision": ACCESS_CONTROLLER_HIKVISION,
    "access-zkteco": ACCESS_CONTROLLER_ZKTECO,
    
    # UPS
    "ups-apc-5kva": UPS_APC_5KVA,
}
