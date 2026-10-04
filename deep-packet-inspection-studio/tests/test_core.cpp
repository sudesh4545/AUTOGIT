#include "sentinel/parser.hpp"
#include <cassert>
#include <iostream>
using namespace sentinel;
int main(){ParsedPacket p;p.source_ip=0xc0a80164;p.destination_ip=0x08080808;p.source_port=51000;p.destination_port=53;p.protocol=Protocol::UDP;auto k=canonical_flow(p);assert(k.first.ip==0x08080808);assert(ip_to_string(0xc0a80164)=="192.168.1.100");std::vector<uint8_t> dns(12,0);dns.insert(dns.end(),{3,'w','w','w',7,'e','x','a','m','p','l','e',3,'c','o','m',0});assert(PacketParser::extract_dns_name(dns)=="www.example.com");std::string http="GET / HTTP/1.1\r\nHost: GitHub.com\r\n\r\n";assert(PacketParser::extract_http_host({(const uint8_t*)http.data(),http.size()})=="github.com");assert(PacketParser::classify("www.youtube.com",443,Protocol::TCP)=="YouTube");std::cout<<"All SentinelDPI core tests passed.\n";}
