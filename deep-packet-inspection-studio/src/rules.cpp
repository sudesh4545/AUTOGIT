#include "sentinel/rules.hpp"
#include <algorithm>
#include <cctype>
#include <fstream>
#include <sstream>
#include <stdexcept>

namespace sentinel { namespace {std::string trim(std::string s){auto n=[](unsigned char c){return!std::isspace(c);};s.erase(s.begin(),std::find_if(s.begin(),s.end(),n));s.erase(std::find_if(s.rbegin(),s.rend(),n).base(),s.end());std::transform(s.begin(),s.end(),s.begin(),[](unsigned char c){return char(std::tolower(c));});return s;}uint32_t parse_ip(const std::string&s){std::istringstream in(s);uint32_t a,b,c,d;char x,y,z;if(in>>a>>x>>b>>y>>c>>z>>d&&x=='.'&&y=='.'&&z=='.'&&a<256&&b<256&&c<256&&d<256)return(a<<24)|(b<<16)|(c<<8)|d;throw std::runtime_error("Invalid IP rule: "+s);}bool matches(const std::string&host,const std::string&rule){return host==rule||(host.size()>rule.size()&&host.ends_with('.'+rule));}}
void RuleEngine::load(const std::filesystem::path&path){std::ifstream in(path);if(!in)throw std::runtime_error("Cannot open rules file: "+path.string());std::string line;size_t number=0;while(std::getline(in,line)){number++;line=trim(line);if(line.empty()||line[0]=='#')continue;auto sep=line.find('=');if(sep==std::string::npos)throw std::runtime_error("Bad rule at line "+std::to_string(number));auto key=trim(line.substr(0,sep)),value=trim(line.substr(sep+1));if(key=="block_domain")blocked_domains_.insert(value);else if(key=="allow_domain")allowed_domains_.insert(value);else if(key=="block_app")blocked_apps_.insert(value);else if(key=="block_ip")blocked_ips_.insert(parse_ip(value));else throw std::runtime_error("Unknown rule type at line "+std::to_string(number));}}
RuleDecision RuleEngine::decide(const ParsedPacket&p)const{for(const auto&r:allowed_domains_)if(matches(p.host,r))return{Verdict::Allow,"Explicit domain allow rule"};if(blocked_ips_.contains(p.source_ip)||blocked_ips_.contains(p.destination_ip))return{Verdict::Drop,"IP block rule"};std::string app=p.application;std::transform(app.begin(),app.end(),app.begin(),[](unsigned char c){return char(std::tolower(c));});if(blocked_apps_.contains(app))return{Verdict::Drop,"Application block rule: "+p.application};for(const auto&r:blocked_domains_)if(matches(p.host,r))return{Verdict::Drop,"Domain block rule: "+r};return{};}
size_t RuleEngine::count()const{return blocked_domains_.size()+allowed_domains_.size()+blocked_apps_.size()+blocked_ips_.size();}
}
