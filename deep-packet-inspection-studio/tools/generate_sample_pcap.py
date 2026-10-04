"""Generate a deterministic, synthetic Ethernet/IPv4 PCAP for SentinelDPI demos."""
from pathlib import Path
import argparse, socket, struct, time

def checksum(data: bytes) -> int:
    if len(data) % 2: data += b"\0"
    total = sum(struct.unpack(f"!{len(data)//2}H", data))
    total = (total >> 16) + (total & 0xFFFF); total += total >> 16
    return (~total) & 0xFFFF

def ethernet(payload: bytes) -> bytes:
    return bytes.fromhex("aabbccddeeff0011223344550800") + payload

def ipv4(src: str, dst: str, protocol: int, payload: bytes, ident: int) -> bytes:
    header = struct.pack("!BBHHHBBH4s4s",0x45,0,20+len(payload),ident,0,64,protocol,0,socket.inet_aton(src),socket.inet_aton(dst))
    header = header[:10] + struct.pack("!H",checksum(header)) + header[12:]
    return header + payload

def udp(src: int, dst: int, payload: bytes) -> bytes:
    return struct.pack("!HHHH",src,dst,8+len(payload),0)+payload

def tcp(src: int, dst: int, payload: bytes, seq: int=1) -> bytes:
    return struct.pack("!HHIIBBHHH",src,dst,seq,0,0x50,0x18,65535,0,0)+payload

def dns_query(host: str) -> bytes:
    labels=b"".join(bytes([len(x)])+x.encode() for x in host.split("."))+b"\0"
    return struct.pack("!HHHHHH",0x1234,0x0100,1,0,0,0)+labels+struct.pack("!HH",1,1)

def write(path: Path):
    packets=[]
    packets.append(ethernet(ipv4("192.168.1.10","8.8.8.8",17,udp(53001,53,dns_query("github.com")),1)))
    packets.append(ethernet(ipv4("192.168.1.10","93.184.216.34",6,tcp(51001,80,b"GET / HTTP/1.1\r\nHost: example-blocked.test\r\nUser-Agent: SentinelDemo\r\n\r\n"),2)))
    packets.append(ethernet(ipv4("192.168.1.20","93.184.216.34",6,tcp(51002,80,b"GET /docs HTTP/1.1\r\nHost: github.com\r\n\r\n"),3)))
    packets.append(ethernet(ipv4("203.0.113.99","192.168.1.10",17,udp(42000,9000,b"synthetic-test-data"),4)))
    with path.open("wb") as f:
        f.write(struct.pack("<IHHIIII",0xA1B2C3D4,2,4,0,0,65535,1))
        now=int(time.time())
        for i,p in enumerate(packets): f.write(struct.pack("<IIII",now+i,i*1000,len(p),len(p))); f.write(p)
    print(f"Generated {len(packets)} safe synthetic packets: {path}")

if __name__ == "__main__":
    parser=argparse.ArgumentParser();parser.add_argument("output",nargs="?",default="sample.pcap");args=parser.parse_args();write(Path(args.output))
