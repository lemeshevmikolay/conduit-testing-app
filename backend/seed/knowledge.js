"use strict";

const { KnowledgeItem, KnowledgeSource, KnowledgeRelation } = require("../models");
const { Op } = require("sequelize");
const { topics } = require("./knowledgeContent");
const { networkingRevisions, architectureOrder } = require("./architectureArticleRevisions");
const { technologyArticles } = require("./technologyEncyclopedia");

// The network and platform entries extend the reviewed topic packages with
// practical QA scenarios. Article copy is assembled from these authored fields.
const networkSourceRef = {
  "OSI model and practical protocol mapping": "osi", "TCP/IP model": "tcpip", "IPv4 and IPv6": "ipv6",
  "MAC addresses and Ethernet switching": "arp", "ARP and neighbor discovery": "arp",
  "DHCP address configuration": "dhcp", "NAT and port translation": "nat", "Routing and default gateways": "routing",
  "Switching, VLANs and broadcast domains": "vlan", "QUIC and HTTP/3 transport": "quic",
  "TLS certificates and handshake": "tls", "HTTP/1.1, HTTP/2 and HTTP/3 behavior": "httpversions",
  "Packets, MTU and path MTU discovery": "mtu", "Ports, sockets and listeners": "tcpip", "Firewalls and network policy": "firewall",
};
const extra = (category, subject, fact, nuance, tip, check, risk, q, a, ref = "rfc") =>
  ({ category, subject, fact, nuance, tip, check, risk, q, a, ref: networkSourceRef[subject] || ref });

const networking = [
  extra("Networking", "OSI model and practical protocol mapping", "OSI is a teaching and troubleshooting model that separates physical transmission, link delivery, network routing, transport, session, representation and application concerns.", "Real stacks do not map every protocol to exactly one layer; TCP/IP is a practical suite and HTTP, TLS and transport boundaries vary by version.", "Describe an observed failure at the layer where evidence exists, then follow dependencies in both directions.", "Capture DNS result, connection establishment, negotiated TLS, HTTP exchange and application trace for one request.", "Calling every network symptom an application defect hides the failing boundary and delays ownership.", "A browser request fails before an HTTP response exists. How would you narrow the failing OSI/TCP-IP boundary?", "Check name resolution, route/reachability, TCP or QUIC establishment, TLS negotiation, then HTTP and application logs. The absence of an HTTP response is itself useful evidence; use browser timing, packet capture where permitted, and correlation IDs."),
  extra("Networking", "TCP/IP model", "The Internet protocol suite commonly groups link, internet, transport and application responsibilities.", "It is a useful operational model, not a one-to-one replacement for every OSI layer.", "Use the model to frame evidence: IP reachability does not prove TCP listener health, and an open TCP connection does not prove an HTTP route works.", "Compare ICMP reachability, TCP connect, TLS handshake and an application request without treating one as a substitute for another.", "A successful ping can coexist with a blocked service port or failed application dependency.", "Why can ping succeed while the application is unavailable?", "Ping tests ICMP reachability, not the target TCP/UDP port, TLS certificate, proxy route, process readiness or application contract. Test each boundary explicitly."),
  extra("Networking", "IPv4 and IPv6", "IPv4 uses 32-bit addresses; IPv6 uses 128-bit addresses and has different address and neighbor-discovery behavior.", "Dual-stack systems can resolve both address families and select a path whose behavior differs by network.", "Test DNS A and AAAA records, client preference, firewall rules and callback allowlists in both supported families.", "Run the same flow from IPv4-only, IPv6-only and dual-stack clients where environments allow; compare connection timings and logs.", "An IPv4-only test environment can miss a broken IPv6 route or an incorrect address literal parser.", "A service works on office Wi-Fi but times out on a mobile IPv6 network. What do you inspect?", "Check AAAA resolution, IPv6 routing/firewall, listener binding, load-balancer health and whether the client falls back to IPv4. Correlate the selected address family with connection logs."),
  extra("Networking", "MAC addresses and Ethernet switching", "A MAC address identifies a link-layer interface on a local network segment; switches forward frames using learned MAC-to-port mappings.", "MAC addresses are not end-to-end Internet identities and are not normally visible across routed networks.", "When investigating local-only failures, distinguish link connectivity and VLAN/switch path from IP routing and DNS.", "Compare interface state, VLAN, ARP/neighbor table and switch port counters with a known-good host.", "Treating a MAC address as a routable destination leads to incorrect diagnosis outside the local link.", "Why does a remote server not see the laptop's Ethernet MAC as the source identity?", "Routers remove the incoming link-layer frame and build a new frame for the next hop. IP addressing is used across routed paths; MAC addressing is scoped to each link."),
  extra("Networking", "ARP and neighbor discovery", "ARP resolves an IPv4 next-hop address to a link-layer address on a local network; IPv6 uses Neighbor Discovery mechanisms.", "Resolution is local to a link and is commonly cached, so stale entries can create intermittent reachability symptoms.", "Inspect the route first: a host resolves the gateway MAC for off-subnet traffic, not the remote server MAC.", "Compare neighbor-cache entries and packet captures before and after cache expiry or controlled refresh.", "Assuming ARP resolves public hostnames confuses name resolution with local next-hop resolution.", "When does a client ARP for the gateway rather than the destination?", "If the destination is outside the local subnet, routing selects a next hop, commonly the default gateway; ARP resolves that gateway's local-link address."),
  extra("Networking", "DHCP address configuration", "DHCP leases network configuration such as an IP address, prefix, router and DNS servers to clients.", "Lease renewal, relay agents and address pools make failures dependent on time and network segment.", "Capture the assigned address, lease, gateway and resolver when a defect appears; compare them with a working segment.", "Exercise lease acquisition and renewal, pool exhaustion behavior, reservation conflicts and DNS-option changes in a controlled network.", "A stale lease or wrong DNS option can look like an application outage while only affecting some clients.", "A test device works until its network lease renews. What would you compare?", "Compare lease timers, assigned IP/prefix, gateway and DNS before and after renewal, plus DHCP server and relay logs. Check for address conflicts or changed options."),
  extra("Networking", "NAT and port translation", "Network Address Translation rewrites address information between network scopes; port translation can multiplex private connections onto public addresses.", "NAT is stateful in common deployments and its mapping lifetime can affect long-lived or idle connections.", "Include source network, translated address/port and connection lifetime when diagnosing callbacks or allowlists.", "Test inbound callbacks, idle timeout, reconnect and concurrent sessions through the actual NAT path.", "An allowlist that uses a private client address will not match the public egress identity seen by a partner.", "Why can a partner observe a different client IP than the application host has locally?", "An egress NAT or proxy translates the source address. Confirm the public egress IP at the network boundary and coordinate allowlists against that value."),
  extra("Networking", "Routing and default gateways", "Routers forward IP packets between networks using destination prefixes and routing tables.", "Asymmetric paths and policy routes can make one direction work while return traffic fails.", "Record source and destination subnets, gateway, route decision and return path for intermittent connectivity.", "Compare route tables and traceroute results from both endpoints; validate security groups and return routes.", "A route to the destination alone does not prove that the response can return.", "A TCP SYN reaches a service but no handshake completes. What routing case can cause this?", "A missing or asymmetric return route can drop the SYN-ACK. Inspect both directions, firewall state and network ACLs rather than only the forward trace."),
  extra("Networking", "Switching, VLANs and broadcast domains", "Switches forward local frames; VLAN configuration partitions a physical network into logical broadcast domains.", "A port can have the wrong access VLAN or trunk tagging even when link lights indicate a physical connection.", "Compare the affected device's VLAN and subnet with a control device on the intended segment.", "Verify DHCP assignment, gateway reachability and switch port VLAN configuration for the exact test port.", "A copied IP configuration does not move a device into the correct VLAN.", "Two hosts on the same floor cannot communicate although both have valid IPs. What do you check?", "Check subnet masks, VLAN membership, routing between VLANs, ACLs and local firewalls. Valid addresses alone do not establish a permitted path."),
  extra("Networking", "QUIC and HTTP/3 transport", "QUIC provides encrypted multiplexed streams over UDP and is used by HTTP/3.", "UDP reachability, middlebox behavior and fallback to another HTTP version can change observed results.", "When comparing HTTP versions, capture negotiated protocol and transport rather than inferring from a URL or browser setting.", "Test UDP blocking, connection migration and fallback behavior; correlate client, edge and origin protocol logs.", "A network that permits TCP/443 but blocks UDP can prevent HTTP/3 while HTTP/2 remains usable.", "Why might HTTP/3 fail on one corporate network while the site still loads?", "QUIC uses UDP and may be blocked or mishandled by a firewall. The browser may fall back to TCP-based HTTP, so inspect negotiated protocol and timing."),
  extra("Networking", "TLS certificates and handshake", "TLS authenticates a server certificate for a hostname and negotiates keys and cryptographic parameters before protected application data is exchanged.", "Certificate chain, hostname, validity, trust store, SNI and protocol policy can each cause handshake failure.", "Capture certificate details and negotiated TLS version from the same client environment that shows the defect.", "Test expired, untrusted, wrong-host and incomplete-chain certificates in a controlled environment; verify renewal monitoring.", "A certificate valid for an IP may not be valid for the DNS hostname used by the client.", "A site opens in one browser but fails certificate validation in another. What evidence matters?", "Compare trust stores, system time, hostname/SNI, certificate chain, revocation policy and negotiated TLS parameters. Record the exact validation error without bypassing it."),
  extra("Networking", "HTTP/1.1, HTTP/2 and HTTP/3 behavior", "HTTP versions share core HTTP semantics but use different message framing and transport mechanisms.", "HTTP/2 multiplexes streams over a connection; HTTP/3 maps HTTP semantics to QUIC. Deployment intermediaries can alter version negotiation.", "Verify status, headers and body semantics across versions, and include protocol in performance and defect evidence.", "Compare concurrent requests, connection reuse, redirects and error responses with each protocol enabled in a controlled client.", "A proxy may support a different protocol version from the browser or origin, so client observations alone may not identify the failing hop.", "How can the same HTTP endpoint behave differently across HTTP/1.1 and HTTP/2?", "Core semantics should remain consistent, but framing, multiplexing, connection reuse and intermediary support differ. Check negotiated version and isolate each hop before attributing a defect."),
  extra("Networking", "Packets, MTU and path MTU discovery", "MTU limits the size of a link-layer payload; oversized IP packets may require fragmentation or may be dropped depending on path and protocol behavior.", "A tunnel or VPN adds encapsulation overhead and can reduce effective path MTU.", "Investigate size-dependent failures with payload boundaries and network path evidence rather than only small health requests.", "Transfer progressively larger payloads over VPN and direct paths; inspect retransmissions, fragmentation signals and tunnel MTU.", "Small API calls can pass while uploads or large responses stall due to a path-MTU issue.", "Why does login work through VPN while large file upload hangs?", "The larger flow may exceed effective path MTU or trigger blocked fragmentation/PMTUD. Compare payload sizes and tunnel overhead, and capture packet-level evidence."),
  extra("Networking", "Ports, sockets and listeners", "A socket endpoint combines transport protocol with local/remote addresses and ports; a listening process accepts connections on configured endpoints.", "TCP and UDP have separate port spaces, and container or proxy port publishing adds another mapping layer.", "Check the process bind address, protocol, container mapping and firewall rule for the exact destination port.", "Test loopback, host interface, container network and external route separately; verify both TCP and UDP where required.", "A process bound only to localhost may pass an in-container check yet remain unreachable externally.", "The process is running but clients receive connection refused. What do you inspect?", "Confirm a listener exists on the expected address and protocol, port publishing is correct, and no firewall rejects it. A running process does not imply a reachable socket."),
  extra("Networking", "Firewalls and network policy", "Firewalls apply rules to traffic based on attributes such as addresses, ports, protocol, connection state and identity.", "Policy can differ at host, cloud network, Kubernetes and edge layers; a permitted outbound flow does not imply inbound permission.", "Ask which enforcement point logged a deny and compare the exact source, destination, port and protocol tuple.", "Test allow and deny cases from each relevant network zone and verify rule changes propagate as intended.", "Broad rules can mask the missing narrow rule and expose unrelated services.", "A service is reachable from a pod but not from a developer laptop. How do you localize policy?", "Compare DNS and route, then inspect host/cloud firewall, security group, network ACL, cluster policy, service exposure and edge rules for each path."),
];

const tools = [
  extra("Databases", "PostgreSQL transactions and isolation", "A database transaction groups operations under atomicity and isolation guarantees; PostgreSQL implements MVCC so readers and writers can often proceed without blocking each other.", "The visible result depends on isolation level, constraints, locks and transaction boundaries.", "Test invariants under concurrent updates, rollback and retries instead of checking only a single sequential happy path.", "Run two transactions against the same row and inspect committed state, SQLSTATE and lock waits.", "A passing single-user test cannot reveal lost updates or serialization failures.", "How would you test inventory updates under concurrent purchases?", "Create controlled parallel transactions against limited stock; assert the invariant, accepted conflict behavior, rollback and retry safety. Record isolation level and resulting rows." , "postgres"),
  extra("Message Brokers", "Apache Kafka topics, partitions and consumer groups", "Kafka stores ordered records within partitions; consumer groups divide partition assignment among consumers.", "Ordering is partition-scoped, and retention/replay behavior differs from a queue that deletes each message on acknowledgement.", "Test key selection, partition growth, replay, offset commits and consumer lag against the product's delivery contract.", "Publish duplicate and out-of-order business events with controlled keys; restart a consumer before and after offset commit.", "Assuming global ordering across partitions can hide race conditions in downstream state.", "A consumer processes an event twice after restart. Is that necessarily a broker defect?", "Not necessarily. At-least-once processing and a crash between side effect and offset commit can cause redelivery. Consumers need idempotent effects or transactional coordination." , "kafka"),
  extra("Message Brokers", "RabbitMQ exchanges, queues and acknowledgements", "RabbitMQ routes published messages through exchanges and bindings into queues; consumer acknowledgements determine when deliveries can be removed.", "Requeue, dead-lettering, prefetch and publisher confirms change failure and throughput behavior.", "Verify routing keys and acknowledgement timing as well as message body; test broker restart and unavailable consumers.", "Publish unroutable messages, crash a consumer before acknowledgement and inspect redelivery/dead-letter policy.", "Acknowledging before durable business processing can lose work after a consumer crash.", "How do you distinguish a lost RabbitMQ message from a delayed one?", "Trace publisher confirms, exchange binding, queue depth, consumer state and acknowledgement. Check TTL, dead-letter routing and retry policy before concluding loss." , "rabbit"),
  extra("Containers", "Kubernetes deployments, pods and services", "Kubernetes controllers reconcile declared desired state; Deployments manage replica sets and Services provide stable discovery over changing pods.", "A pod being Running does not prove the application is ready, and service routing depends on readiness and selectors.", "Inspect events, readiness, endpoints and rollout history together when diagnosing deployment issues.", "Test rolling update with one unhealthy replica, selector mismatch and delayed startup; check traffic reaches only ready endpoints.", "Overly permissive readiness checks can send user traffic to a partially initialized pod.", "A Deployment shows available replicas but requests still fail intermittently. What do you inspect?", "Check Service selectors/endpoints, readiness transitions, ingress, pod logs, startup dependencies and rollout revisions. Availability counts do not prove every route or instance is healthy." , "kubernetes"),
  extra("Infrastructure", "Nginx as reverse proxy", "A reverse proxy accepts client requests and forwards them to upstream servers, often applying TLS termination, routing, buffering or caching policies.", "Forwarded headers, timeout settings and upstream health affect the request seen by the application.", "Capture both edge and upstream request IDs, and compare configured host/path rewriting with the application route.", "Test upstream timeout, connection refusal, large body, forwarded scheme/host and client-IP handling.", "Trusting client-supplied forwarded headers can enable spoofing if the proxy boundary is not enforced.", "The backend redirects HTTP to HTTP although the browser connected with HTTPS. What could be wrong?", "TLS may terminate at the proxy while the application receives plain HTTP and lacks trusted forwarded-protocol metadata. Verify proxy headers and trust configuration." , "nginx"),
  extra("Identity and Security", "OAuth 2.0 roles and authorization flows", "OAuth 2.0 is an authorization framework for obtaining limited access to protected resources; it defines roles and grant interactions rather than a single login protocol.", "OpenID Connect adds an identity layer; a bearer access token alone does not establish how the user authenticated.", "Test redirect URI validation, scope boundaries, token audience, expiry and consent across the chosen flow.", "Attempt least-privilege and over-privilege requests; test state/PKCE protections where the client flow requires them.", "Treating an access token as proof of identity can lead to incorrect account linking.", "Why is OAuth access-token validation not identical to user authentication?", "OAuth authorizes access to resources; token meaning and subject depend on the authorization server/resource server contract. OIDC defines identity claims and ID tokens for authentication." , "oauth"),
  extra("Identity and Security", "JWT validation and token lifecycle", "JWT is a token format whose claims are integrity-protected when signed; consumers must validate signature and relevant claims under an explicit trust policy.", "Decoding a JWT is not validation; algorithm, issuer, audience, expiry and key rotation all matter.", "Test expired, wrong-audience, wrong-issuer, altered-signature and rotated-key cases, and ensure secrets never appear in logs.", "Change one claim or signature byte and confirm rejection; verify refresh and revocation behavior against product requirements.", "Accepting a token based only on its decoded payload allows forged claims.", "What must a resource server check before accepting a signed JWT?", "Validate an allowed algorithm and signature, trusted issuer/key, expected audience, temporal claims and any required scopes or roles. Define key rotation and revocation expectations." , "jwt"),
  extra("Monitoring", "Prometheus metrics and alerting", "Prometheus collects labeled time-series metrics, typically by scraping instrumented targets, and evaluates queries and alert rules.", "Metric labels form series cardinality; unbounded labels such as user IDs can overload storage.", "Check metric freshness and labels alongside the dashboard value; tie alerts to user-visible symptoms and actionable thresholds.", "Stop a target, return stale data and introduce a high-cardinality label in a test environment; verify alert and ingestion behavior.", "A green dashboard can reflect stale samples or an incorrect query rather than healthy service behavior.", "Latency improves on a dashboard, but users still report timeouts. What do you verify?", "Validate query aggregation, histogram buckets, scrape freshness, traffic segmentation and end-to-end traces. Compare server metrics with client-observed latency and errors." , "prometheus"),
  extra("Monitoring", "OpenTelemetry traces, metrics and logs", "OpenTelemetry provides vendor-neutral APIs, SDKs and protocol conventions for generating and exporting telemetry.", "Instrumentation and collector pipelines are separate from the backend that stores and visualizes telemetry.", "Verify context propagation across asynchronous boundaries and ensure sensitive attributes are filtered.", "Trace one request across services and a queue; confirm parent/child spans, sampling, exporter errors and correlation to logs.", "A missing span may indicate sampling, broken context propagation or uninstrumented code, not necessarily a missing request.", "A distributed trace stops at a message broker. Which boundary do you inspect?", "Check whether trace context is injected into message headers and extracted by the consumer, then inspect sampling and exporter pipelines at both services." , "otel"),
  extra("Orchestration", "Apache Airflow DAG scheduling", "Airflow models workflows as DAGs of tasks and schedules task instances for logical data intervals.", "A scheduled run's logical date is not necessarily its wall-clock start time; retries and backfills can execute work more than once.", "Test idempotency, dependencies, catchup policy, retries and data interval boundaries for each task.", "Trigger a retry and backfill around a daylight-saving boundary; verify output partitions and duplicate side effects.", "A task that assumes exactly-once execution can duplicate downstream records after retry.", "A DAG task succeeded twice for the same business date. What configuration and code do you inspect?", "Inspect schedule/data interval, catchup/backfill, retry history and task idempotency. Make output writes keyed or transactional so repeated task attempts are safe." , "airflow"),
  extra("Identity and Security", "Keycloak realms, clients and identity federation", "Keycloak provides identity and access management; realms isolate identity configuration and clients represent applications or services.", "Client type, redirect URI, scopes, identity providers and token settings shape the actual security boundary.", "Test each client registration and realm configuration as deployed, including logout and key rotation behavior.", "Exercise authorization-code flow, invalid redirect URI, role mapping and federated identity failure in a non-production realm.", "A role mapped in an identity provider may not become the application role expected by the resource server.", "A user signs in successfully but receives 403 from the API. What identity mapping do you trace?", "Follow realm and client configuration, requested scopes, token claims, role mapping and the API's authorization policy. Authentication success does not grant every resource permission." , "keycloak"),
];

const sources = {
  qa: [{ title: "QA_bible: interview and practical testing examples", url: "https://github.com/VladislavEremeev/QA_bible/blob/master/prakticheskaya-chast/primery-zadach-na-sobesedovaniyakh-i-testovykh-zadanii.md", type: "community", description: "Topic inspiration and scenario coverage; answers are independently authored." }],
  architecture: [{ title: "Microsoft Learn: Architecture styles", url: "https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/", type: "official", description: "Architecture styles, constraints, trade-offs and selection guidance." }],
  monolith: [{ title: "Microsoft Learn: Architecture styles", url: "https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/", type: "official", description: "Architecture styles and their trade-offs." }],
  microservices: [{ title: "Microsoft Learn: Microservices architecture style", url: "https://learn.microsoft.com/azure/architecture/guide/architecture-styles/microservices", type: "official", description: "Bounded contexts, service autonomy, data ownership and operational trade-offs." }],
  api: [{ title: "OpenAPI Specification", url: "https://spec.openapis.org/oas/latest.html", type: "standard", description: "Machine-readable description of HTTP API operations and schemas." }],
  http: [{ title: "RFC 9110: HTTP Semantics", url: "https://www.rfc-editor.org/rfc/rfc9110.html", type: "standard", description: "Normative reference for HTTP semantics, methods and status codes." }],
  osi: [{ title: "ITU-T X.200: Open Systems Interconnection model", url: "https://www.itu.int/rec/T-REC-X.200/en", type: "standard", description: "Reference model for the seven OSI layers." }],
  tcpip: [{ title: "RFC 1122: Requirements for Internet Hosts — Communication Layers", url: "https://www.rfc-editor.org/rfc/rfc1122.html", type: "standard", description: "Host requirements across link, IP and transport layers." }],
  ipv6: [{ title: "RFC 8200: Internet Protocol, Version 6 (IPv6) Specification", url: "https://www.rfc-editor.org/rfc/rfc8200.html", type: "standard", description: "Normative IPv6 protocol specification." }],
  arp: [{ title: "RFC 826: An Ethernet Address Resolution Protocol", url: "https://www.rfc-editor.org/rfc/rfc826.html", type: "standard", description: "Address resolution on a directly connected network." }],
  dhcp: [{ title: "RFC 2131: Dynamic Host Configuration Protocol", url: "https://www.rfc-editor.org/rfc/rfc2131.html", type: "standard", description: "DHCP message exchange and lease configuration." }],
  nat: [{ title: "RFC 3022: Traditional IP Network Address Translator", url: "https://www.rfc-editor.org/rfc/rfc3022.html", type: "rfc", description: "Informational description of traditional address and port translation behavior." }],
  routing: [{ title: "RFC 1812: Requirements for IP Version 4 Routers", url: "https://www.rfc-editor.org/rfc/rfc1812.html", type: "standard", description: "IPv4 router forwarding and behavior requirements." }],
  vlan: [{ title: "IEEE 802.1Q VLAN Bridging", url: "https://www.ieee802.org/1/pages/802.1Q.html", type: "standard", description: "VLAN and bridged-network standards work." }],
  quic: [{ title: "RFC 9000: QUIC: A UDP-Based Multiplexed and Secure Transport", url: "https://www.rfc-editor.org/rfc/rfc9000.html", type: "standard", description: "QUIC transport protocol specification." }],
  tls: [{ title: "RFC 8446: The Transport Layer Security (TLS) Protocol Version 1.3", url: "https://www.rfc-editor.org/rfc/rfc8446.html", type: "standard", description: "TLS 1.3 handshake and record protocol." }],
  httpversions: [{ title: "RFC 9113: HTTP/2", url: "https://www.rfc-editor.org/rfc/rfc9113.html", type: "standard", description: "HTTP/2 framing and multiplexed streams." }, { title: "RFC 9114: HTTP/3", url: "https://www.rfc-editor.org/rfc/rfc9114.html", type: "standard", description: "HTTP mapping over QUIC." }],
  mtu: [{ title: "RFC 8201: Path MTU Discovery for IP version 6", url: "https://www.rfc-editor.org/rfc/rfc8201.html", type: "standard", description: "IPv6 path MTU discovery and packet-too-big handling." }, { title: "RFC 8899: Packetization Layer Path MTU Discovery", url: "https://www.rfc-editor.org/rfc/rfc8899.html", type: "standard", description: "Transport-independent guidance for discovering path MTU." }],
  firewall: [{ title: "NIST SP 800-41 Rev. 1: Guidelines on Firewalls and Firewall Policy", url: "https://csrc.nist.gov/pubs/sp/800/41/r1/final", type: "guidance", description: "NIST firewall concepts and policy guidance, published in 2009; verify deployment details against current platform controls." }],
  education: [{ title: "QA_bible: practical interview examples", url: "https://github.com/VladislavEremeev/QA_bible/blob/master/prakticheskaya-chast/primery-zadach-na-sobesedovaniyakh-i-testovykh-zadanii.md", type: "community", description: "Scenario inspiration; content is independently authored." }],
  rfc: [{ title: "RFC 9110: HTTP Semantics", url: "https://www.rfc-editor.org/rfc/rfc9110.html", type: "standard", description: "Normative reference for HTTP semantics, methods and status codes." }, { title: "MDN: HTTP 502 Bad Gateway", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/502", type: "technical", description: "Practical explanation of gateway and upstream failure semantics." }],
  docker: [{ title: "Docker Docs: Get started", url: "https://docs.docker.com/get-started/", type: "official", description: "Official container and image concepts and workflows." }],
  dockerHabr: [{ title: "Docker Docs: Get started", url: "https://docs.docker.com/get-started/", type: "official", description: "Official container and image concepts and workflows." }],
  compose: [{ title: "Docker Docs: Compose", url: "https://docs.docker.com/compose/", type: "official", description: "Official multi-container application configuration guide." }],
  redis: [{ title: "Redis Docs: Data types", url: "https://redis.io/docs/latest/develop/data-types/", type: "official", description: "Official reference for Redis data structures." }],
  jenkins: [{ title: "Jenkins: Pipeline", url: "https://www.jenkins.io/doc/book/pipeline/", type: "official", description: "Official Pipeline concepts and configuration." }],
  postgres: [{ title: "PostgreSQL: Transaction Isolation", url: "https://www.postgresql.org/docs/current/transaction-iso.html", type: "official", description: "Official description of PostgreSQL transaction isolation." }],
  kafka: [{ title: "Apache Kafka: Documentation", url: "https://kafka.apache.org/documentation/", type: "official", description: "Official reference for topics, partitions and consumer groups." }],
  rabbit: [{ title: "RabbitMQ: Documentation", url: "https://www.rabbitmq.com/docs", type: "official", description: "Official broker, queue, acknowledgement and routing documentation." }],
  kubernetes: [{ title: "Kubernetes: Concepts", url: "https://kubernetes.io/docs/concepts/", type: "official", description: "Official workload, service and reconciliation concepts." }],
  nginx: [{ title: "NGINX: Beginner’s Guide", url: "https://nginx.org/en/docs/beginners_guide.html", type: "official", description: "Official proxy and server configuration guide." }],
  oauth: [{ title: "RFC 6749: OAuth 2.0", url: "https://www.rfc-editor.org/rfc/rfc6749.html", type: "standard", description: "Protocol roles and authorization grant framework." }, { title: "OpenID Connect Core", url: "https://openid.net/specs/openid-connect-core-1_0.html", type: "standard", description: "Identity layer built on OAuth 2.0." }],
  jwt: [{ title: "RFC 7519: JSON Web Token", url: "https://www.rfc-editor.org/rfc/rfc7519.html", type: "standard", description: "JWT claims format and processing context." }, { title: "RFC 8725: JWT Best Current Practices", url: "https://www.rfc-editor.org/rfc/rfc8725.html", type: "standard", description: "Security guidance for JWT deployments." }],
  prometheus: [{ title: "Prometheus: Overview", url: "https://prometheus.io/docs/introduction/overview/", type: "official", description: "Official time-series collection and alerting model." }],
  otel: [{ title: "OpenTelemetry: Documentation", url: "https://opentelemetry.io/docs/", type: "official", description: "Official APIs, SDKs, context and telemetry pipeline reference." }],
  airflow: [{ title: "Apache Airflow: Core concepts", url: "https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/", type: "official", description: "Official DAG, task and scheduling concepts." }],
  keycloak: [{ title: "Keycloak: Server Administration Guide", url: "https://www.keycloak.org/docs/latest/server_admin/", type: "official", description: "Official realms, clients and identity configuration reference." }],
};

// Reviewed Ukrainian interview prompts and answers for the networking and
// platform package. These are scoped to strong junior and middle QA work.
const interviewOverrides = {
  "OSI model and practical protocol mapping": [
    "Запит браузера не отримав HTTP-відповіді. Як послідовно локалізувати можливий рівень мережевої несправності?",
    "Перевірку слід проводити від нижчих рівнів взаємодії до прикладного. Спочатку з'ясуйте, чи резолвиться доменне ім'я та чи має клієнт маршрут до потрібної мережі. Потім перевірте встановлення TCP- або QUIC-з'єднання та узгодження TLS. Лише після успішного проходження цих етапів аналізуйте HTTP-запит і серверну обробку. Відсутність HTTP-відповіді означає, що несправність може виникати до рівня прикладного протоколу. Зафіксуйте час, адресу призначення, помилку браузера й кореляційний ідентифікатор; мережеве захоплення використовуйте лише за наявності доступу та потреби."
  ],
  "TCP/IP model": [
    "Чому успішна відповідь на ping не доводить, що вебзастосунок доступний?",
    "Ping перевіряє обмін ICMP-повідомленнями з вузлом, але не встановлення з'єднання з прикладним сервісом. Для доступності застосунку окремо перевіряють потрібний TCP- або UDP-порт, TLS-узгодження, маршрут через проксі чи балансувальник і відповідь самого сервісу. Тому успішний ping сумісний із закритим портом, помилкою сертифіката або недоступним процесом. QA варто фіксувати результат кожної перевірки окремо: це допомагає визначити межу збою, а не робити висновок про весь продукт за одним мережевим сигналом."
  ],
  "IPv4 and IPv6": [
    "Сервіс працює в офісній мережі, але не відповідає клієнту, який використовує IPv6. Які перевірки допоможуть знайти причину?",
    "Порівняйте DNS-відповіді A та AAAA, адресу, обрану клієнтом, і доступність відповідного маршруту. Далі перевірте правила міжмережевого екрана, прив'язку сервісу до IPv6-інтерфейсу та налаштування балансувальника. Якщо клієнт підтримує обидві версії IP, з'ясуйте, чи відбувається перехід на IPv4 і скільки часу він займає. Однакова перевірка з IPv4-only, IPv6-only та dual-stack середовищ відокремлює проблему DNS від проблеми маршрутизації або конфігурації сервера. У звіті зазначте фактично використану адресу, а не лише назву домену."
  ],
  "MAC addresses and Ethernet switching": [
    "Чому віддалений сервер зазвичай не бачить MAC-адресу Ethernet-інтерфейсу ноутбука?",
    "MAC-адреса використовується для доставки кадру в межах локального канального сегмента. Коли маршрутизатор передає пакет до іншої мережі, він знімає вхідний канальний кадр і формує новий кадр для наступного переходу. IP-адреса описує маршрут між мережами, тоді як MAC-адреса стосується поточного каналу. Тому віддалений сервер отримує кадр від свого безпосереднього мережевого вузла, а не з MAC-адресою початкового ноутбука. У локальній діагностиці порівнюйте інтерфейс, VLAN і таблицю сусідів; для віддаленого шляху аналізуйте IP-маршрутизацію."
  ],
  "ARP and neighbor discovery": [
    "Коли IPv4-клієнт визначає MAC-адресу шлюзу, а не MAC-адресу сервера призначення?",
    "Якщо IP-адреса призначення належить іншій підмережі, таблиця маршрутів обирає наступний вузол — зазвичай шлюз за замовчуванням. ARP у такому разі зіставляє локальну IP-адресу шлюзу з його MAC-адресою. Для вузла в тій самій підмережі клієнт натомість шукає канальну адресу самого вузла. ARP працює в межах локального каналу й не резолвить доменні імена. Перевірте маску підмережі, маршрут і запис у таблиці сусідів; це допомагає відрізнити помилку локальної адресації від проблеми DNS або віддаленої маршрутизації."
  ],
  "DHCP address configuration": [
    "Тестовий пристрій працює до поновлення мережевої оренди, після чого втрачає доступ до сервісу. Що потрібно порівняти?",
    "Порівняйте параметри мережі до та після поновлення DHCP-оренди: IP-адресу й маску, шлюз, DNS-сервери, строк оренди та час появи збою. Перевірте журнали DHCP-сервера й ретранслятора, а також можливий конфлікт адрес. Якщо змінився лише DNS, перевірте резолв домену; якщо змінилися адреса або шлюз — перевірте маршрут і правила доступу. Така послідовність допомагає відрізнити проблему конфігурації клієнта від несправності самого застосунку. Зафіксуйте параметри середовища, щоб відтворити випадок після наступного поновлення."
  ],
  "NAT and port translation": [
    "Партнерський сервіс бачить іншу IP-адресу клієнта, ніж та, що налаштована на сервері. Чим це може пояснюватися і як перевірити?",
    "Вихідний NAT або проксі може замінювати приватну адресу вузла на спільну зовнішню адресу, іноді також змінюючи порт. Порівняйте локальну адресу сервера з адресою, яку бачить партнер, і перевірте маршрут вихідного трафіку та конфігурацію NAT. Для інтеграційного тесту важливо використовувати адресу виходу, фактично спостережену зовнішньою системою, а не адресу з локальної конфігурації. Додатково перевірте час життя трансляції для довгих з'єднань і поведінку повторного підключення. Це дає змогу відрізнити помилку списку дозволених адрес від збою самого API."
  ],
  "Routing and default gateways": [
    "Сервер отримує TCP SYN, але з'єднання не встановлюється. Яка проблема маршрутизації може спричинити таку поведінку?",
    "Запит може дійти до сервера, а відповідь SYN-ACK — загубитися через відсутній або асиметричний зворотний маршрут. Перевірте таблиці маршрутів на обох кінцях, шлюзи, правила мережевого доступу та стан міжмережевих екранів. Одностороння перевірка шляху недостатня: важливо встановити, чи проходить зворотний трафік до клієнта. Зіставте часові відмітки та адреси в мережевих журналах. Якщо TCP-рукостискання не завершене, аналіз HTTP-коду відповіді ще не є доречним, оскільки HTTP-обмін не розпочався."
  ],
  "Switching, VLANs and broadcast domains": [
    "Два пристрої в одному офісі мають IP-адреси, але не можуть обмінюватися даними. Що слід перевірити на локальному мережевому сегменті?",
    "Перевірте маски підмереж, членство портів у VLAN, доступність маршруту між VLAN і правила мережевих списків контролю доступу. Потім з'ясуйте, чи не блокує з'єднання локальний міжмережевий екран пристрою. Наявність коректної IP-адреси не гарантує, що два вузли перебувають в одному широкомовному домені або мають дозволений маршрут між сегментами. Порівняйте налаштування проблемного вузла з контрольним пристроєм у тій самій точці мережі. Такий контроль допомагає локалізувати причину між VLAN-конфігурацією, маршрутизацією та правилами доступу."
  ],
  "QUIC and HTTP/3 transport": [
    "Сайт доступний у браузері, але HTTP/3 не встановлюється в корпоративній мережі. Яку мережеву причину варто перевірити першою?",
    "HTTP/3 використовує QUIC поверх UDP, тому перш за все перевірте, чи дозволено UDP-трафік до відповідного порту та чи не блокує його міжмережевий екран або проксі. Браузер може перейти на HTTP/2 через TCP, тож сам факт успішного завантаження сторінки не доводить, що HTTP/3 працював. Перевірте узгоджену версію протоколу в засобах розробника браузера та зіставте її з журналами мережевого краю. Для QA важливо розрізняти помилку HTTP/3 від успішного резервного переходу на інший транспорт і вимірювати поведінку обох шляхів окремо."
  ],
  "TLS certificates and handshake": [
    "Один браузер відкриває сайт, а інший повідомляє про помилку сертифіката. Які параметри слід порівняти?",
    "Перевірте системний час, ім'я хоста в сертифікаті, повноту ланцюжка довіри, довірені кореневі центри сертифікації та узгоджену версію TLS. Також зіставте SNI й мережевий маршрут: різні клієнти можуть потрапляти на різні вузли або використовувати різні сховища сертифікатів. Зафіксуйте точний текст помилки й сертифікат, отриманий саме з проблемного клієнта. Не обходьте перевірку сертифіката для підтвердження працездатності: це приховує дефект безпеки. Порівняння контрольного та проблемного середовищ допоможе локалізувати конфігураційну відмінність."
  ],
  "HTTP/1.1, HTTP/2 and HTTP/3 behavior": [
    "Як перевірити, що однаковий HTTP-ресурс поводиться узгоджено через HTTP/1.1, HTTP/2 та HTTP/3?",
    "Виконайте однакові запити кожною доступною версією протоколу та порівняйте семантику відповіді: статус, заголовки, тіло й обробку помилок. Окремо зафіксуйте фактично узгоджену версію, повторне використання з'єднання, паралельність запитів і переходи між протоколами. Семантика HTTP є спільною, проте способи передавання та підтримка проміжними проксі відрізняються. Тому ізолюйте клієнтський, крайовий і серверний сегменти, перш ніж приписувати розбіжність застосунку. Для порівняння часу відповіді використовуйте однакові умови, дані й кількість повторів."
  ],
  "Packets, MTU and path MTU discovery": [
    "Невеликі API-запити через VPN проходять, а завантаження великих файлів зупиняється. Який мережевий чинник слід перевірити?",
    "Перевірте MTU шляху та накладні витрати інкапсуляції VPN: великий пакет може перевищувати допустимий розмір і втрачатися або вимагати зменшення розміру фрагмента. Порівняйте передачу різних розмірів корисного навантаження через VPN і прямий маршрут, зафіксуйте повторні передавання та повідомлення про перевищення MTU. Малі запити не виявляють такої проблеми, тому що вкладаються в межу шляху. QA може поступово збільшувати розмір файла й зіставляти результат із мережевими журналами. Це відокремлює дефект передавання великих повідомлень від помилки прикладної валідації."
  ],
  "Ports, sockets and listeners": [
    "Процес сервера запущений, але клієнти отримують відмову під час підключення. Які перевірки допоможуть знайти причину?",
    "Переконайтеся, що процес слухає потрібний порт на правильній IP-адресі та використовує очікуваний транспорт — TCP або UDP. Потім перевірте публікацію порту контейнера, правила міжмережевого екрана й доступність адреси з клієнтської мережі. Перевірка з localhost не доводить зовнішню доступність: процес може бути прив'язаний лише до loopback-інтерфейсу. Послідовно перевірте локальний сокет, контейнерне відображення та зовнішнє з'єднання. Такий поділ дозволяє локалізувати конфігурацію слухача, контейнера або мережевої політики."
  ],
  "Firewalls and network policy": [
    "Сервіс доступний із контейнера, але недоступний із ноутбука тестувальника. Як локалізувати блокування мережевою політикою?",
    "Зафіксуйте джерело, призначення, порт і транспорт для обох шляхів, а потім перевірте кожну точку контролю: локальний екран вузла, хмарні правила, мережеві списки доступу, політики кластера та зовнішній шлюз. Порівняйте журнали дозволених і відхилених з'єднань. Доступ із контейнера підтверджує лише його маршрут і не доводить доступність із зовнішньої мережі. Для надійного висновку змінюйте по одному сегменту маршруту або порівнюйте контрольні клієнти. Не розширюйте правило глобально без підтвердження власника політики та потрібного діапазону доступу."
  ],
  "PostgreSQL transactions and isolation": [
    "Як перевірити, що паралельні покупки не резервують більше товару, ніж є на складі?",
    "Сформулюйте інваріант: кількість успішних резервувань не може перевищити доступний запас. Створіть контрольований початковий стан із малою кількістю товару й одночасно виконайте кілька транзакцій. Перевірте зафіксований стан бази, результати конфліктних запитів, відкат і поведінку повтору. У PostgreSQL результат залежить від рівня ізоляції, блокувань і обмежень схеми, тому ці передумови потрібно зафіксувати. Послідовний одиночний тест не виявляє втрачених оновлень і перегонів. Перевірка має підтвердити інваріант після завершення всіх транзакцій, а не лише статус окремого запиту."
  ],
  "Apache Kafka topics, partitions and consumer groups": [
    "Споживач Kafka обробив ту саму подію двічі після перезапуску. Чи обов'язково це означає дефект брокера?",
    "Ні. За моделі доставки щонайменше один раз подія може бути повторно доставлена, якщо споживач завершився після побічної дії, але до фіксації зсуву читання. Перевірте послідовність: отримання запису, виконання бізнес-операції, фіксація зсуву та перезапуск. Споживач має безпечно обробляти повтори, наприклад, через ідемпотентний запис або ключ операції. Також зважайте, що порядок гарантується в межах розділу, а не для всього топіка. QA перевіряє повторну доставку, відновлення споживача та цілісність кінцевих даних."
  ],
  "RabbitMQ exchanges, queues and acknowledgements": [
    "Як відрізнити втрату повідомлення RabbitMQ від затримки його обробки?",
    "Перевірте підтвердження публікації, правильність обміну й прив'язки до черги, глибину черги, активність споживачів і момент підтвердження доставки. Далі з'ясуйте, чи діють строк життя повідомлення, повторне поміщення в чергу або маршрутизація до черги недоставлених повідомлень. Повідомлення може чекати на вільного споживача, бути відхиленим маршрутом або повторно доставлятися після збою. Зіставте ідентифікатор повідомлення та часові відмітки на стороні видавця, брокера й споживача. Це дає змогу визначити, на якому етапі зупинився процес."
  ],
  "Kubernetes deployments, pods and services": [
    "У Kubernetes кількість доступних реплік правильна, але запити періодично завершуються помилкою. Що перевірити?",
    "Перевірте відповідність селекторів Service міткам Pod, фактичні кінцеві точки сервісу та стан readiness-проб. Дослідіть події кластера, журнали кожного Pod, версію розгортання й конфігурацію ingress. Статус Running означає, що контейнерний процес запущений, але не гарантує готовності застосунку приймати запити. Перевірте, чи не потрапляє трафік на вузол до завершення ініціалізації, і чи не залишається несправна репліка серед кінцевих точок. QA має зіставляти час помилок із переходами готовності та змінами розгортання."
  ],
  "Nginx as reverse proxy": [
    "Клієнт підключається до сайту через HTTPS, але застосунок формує перенаправлення на HTTP. Які налаштування проксі перевірити?",
    "TLS може завершуватися на Nginx, тоді як запит до застосунку передається незашифрованим HTTP. Перевірте, чи передає проксі початкову схему через довірений заголовок, чи застосунок правильно обробляє цей заголовок і чи налаштована довіра лише до очікуваного проксі. Також перевірте переписування хоста й шляху та журнали обох компонентів. Якщо застосунок не знає, що зовнішній запит був HTTPS, він може сформувати некоректне перенаправлення. Відтворіть сценарій через реальний крайовий маршрут і зіставте заголовки на вході та виході проксі."
  ],
  "OAuth 2.0 roles and authorization flows": [
    "Чому токен доступу OAuth 2.0 сам по собі не є достатнім доказом автентифікації користувача?",
    "OAuth 2.0 визначає делегування доступу до захищених ресурсів, а не універсальний протокол ідентифікації користувача. Значення токена залежить від його видавця, аудиторії та контракту сервера ресурсів. Для автентифікації користувача OpenID Connect додає узгоджені твердження про особу й окремий ID-токен. QA має перевірити дозволені перенаправлення, межі областей доступу, аудиторію токена та поведінку клієнта з недійсними параметрами. Не слід робити висновок про особу лише з того, що клієнт отримав bearer-токен."
  ],
  "JWT validation and token lifecycle": [
    "Які перевірки має виконати API перед прийняттям підписаного JWT?",
    "Сервер має перевірити підпис за дозволеним алгоритмом і довіреним ключем, а також очікувані видавця й аудиторію. За контрактом перевіряються строк дії, час початку чинності та необхідні області або ролі. Декодування JSON-полів саме по собі не підтверджує справжність токена. QA перевіряє прострочений, змінений, підписаний невідомим ключем токен, неправильні issuer/audience та перехід під час ротації ключів. Окремо уточнюють політику відкликання й оновлення токенів, оскільки підпис не гарантує, що обліковий запис досі має доступ."
  ],
  "Prometheus metrics and alerting": [
    "На графіку Prometheus затримка зменшилася, але користувачі продовжують повідомляти про тайм-аути. Що перевірити?",
    "Перевірте коректність запиту до метрик, часову свіжість вибірок, агрегування гістограми та розподіл за типом трафіку. Порівняйте серверні показники з вимірюваннями клієнта й трасуванням наскрізного запиту. Графік може відображати застарілі дані або усереднювати проблемну групу користувачів із більшістю успішних запитів. Також перевірте стан збору метрик і наявність достатньої кількості вибірок. Висновок про поліпшення слід робити лише після зіставлення метрики з фактичним досвідом клієнтів і часткою помилок."
  ],
  "OpenTelemetry traces, metrics and logs": [
    "Розподілене трасування обривається після проходження повідомлення через брокер. Які ланки перевірити?",
    "Перевірте, чи записується контекст трасування в заголовки повідомлення під час публікації та чи відновлюється споживачем. Далі зіставте батьківський і дочірній сегменти, правила вибірки, помилки експорту й доступність колектора для обох сервісів. Відсутній сегмент може бути наслідком вибірки, втрати контексту або відсутньої інструментації, а не втрати самого повідомлення. Для одного контрольного запиту простежте кореляційний ідентифікатор через видавця, брокер і споживача. Це допомагає встановити, на якому переході порушилося передавання телеметрії."
  ],
  "Apache Airflow DAG scheduling": [
    "Завдання Airflow повторно створило дані за ту саму календарну дату. Які налаштування та властивості завдання слід перевірити?",
    "Перевірте логічний інтервал запуску, розклад, параметри catchup і backfill, історію повторів та ключі вихідних даних. Повторне виконання може бути очікуваним наслідком відновлення після помилки, тому завдання має бути ідемпотентним або записувати результат транзакційно. Логічна дата запуску не завжди збігається з фактичним часом старту. Перевірте, чи вихідні записи прив'язані до інтервалу даних, а не лише до часу виконання. Для QA корисно контрольовано повторити запуск і звірити, що повтор не створює дублікати та не змінює коректні результати."
  ],
  "Keycloak realms, clients and identity federation": [
    "Користувач успішно ввійшов через Keycloak, але API повертає 403. Які твердження й налаштування потрібно зіставити?",
    "Автентифікація підтверджує особу, але не гарантує право на кожну операцію. Перевірте realm і client, запитані області доступу, ролі в токені, зіставлення ролей зовнішнього постачальника і політику авторизації самого API. Зіставте конкретне твердження токена з вимогами ресурсу. Неправильний мапінг може успішно виконати вхід, але не надати застосунку очікувану роль. QA перевіряє як дозволений сценарій, так і користувача без потрібної ролі; окремо фіксує, на якому рівні виникло 403."
  ],
};

const defaultSource = sources.qa[0];
const networkingIndices = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,64,65,66,83,95,96,97,98,101,103];
const toolIndices = [25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,68,69,70,71,72,73,74,75,76,77,80,84,85,99,100];
const toTitle = (topic) => topic.subject;
const slugPart = (text) => text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/[а-яёіїєґ]/g, (letter) => ({ а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", ё: "yo", є: "ye", ж: "zh", з: "z", и: "y", і: "i", ї: "yi", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" })[letter] || letter)
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);

function articleRecord(section, topic, index, stableIndex = index) {
  if (section === "tools" && topic.body && topic.title && topic.summary) {
    const articleSources = topic.sources;
    return {
      slug: `tools-${slugPart(topic.title) || "topic"}-${index + 1}`, kind: "article", section,
      category: topic.category, title: topic.title, summary: topic.summary, body: topic.body,
      question: null, answer: null, difficulty: "middle", questionType: null,
      orderIndex: index, estimatedReadingTime: Math.max(1, Math.ceil(topic.body.trim().split(/\s+/).length / 220)),
      sourceName: articleSources[0].title, sourceUrl: articleSources[0].url,
      sources: articleSources, related: topic.related || [], tags: [section, topic.category], published: true,
    };
  }
  const qaOverride = interviewOverrides[topic.subject];
  const selfCheckQuestion = qaOverride?.[0] || topic.q;
  const selfCheckAnswer = qaOverride?.[1] || topic.a;
  const category = topic.articleCategory || topic.category;
  const answer = topic.articleBody || (section === "architecture"
    ? [
      `${topic.fact} ${topic.nuance}`,
      `${topic.tip} ${topic.check}`,
      topic.risk,
      `${selfCheckQuestion}\n\n${selfCheckAnswer}`,
    ].join("\n\n")
    : [
      `## Concept\n${topic.fact}`,
      `## How it works\n${topic.nuance}`,
      `## Practical QA approach\n${topic.tip}\n\n${topic.check}`,
      `## Failure modes\n${topic.risk}`,
      `## Self-check\n${selfCheckQuestion}\n\n${selfCheckAnswer}`,
    ].join("\n\n"));
  const articleSources = topic.articleSources || (Array.isArray(sources[topic.ref]) && sources[topic.ref]) || (section === "architecture" ? sources.rfc : [defaultSource]);
  return {
    slug: topic.articleSlug || `${section}-${slugPart(topic.subject) || "topic"}-${stableIndex + 1}`, kind: "article", section, category,
    title: topic.articleTitle || toTitle(topic), summary: topic.articleSummary || topic.fact.slice(0, 490), body: answer,
    question: selfCheckQuestion || null, answer: selfCheckAnswer || null, difficulty: "middle", questionType: null,
    orderIndex: index, estimatedReadingTime: Math.max(1, Math.ceil(answer.trim().split(/\s+/).length / 220)),
    sourceName: articleSources[0].title, sourceUrl: articleSources[0].url,
    sources: articleSources, related: topic.related || [], tags: [section, category, topic.subject], published: true,
  };
}

function questionCategory(topic) {
  const value = `${topic.category} ${topic.subject} ${topic.q}`.toLowerCase();
  if (/bug-report|баг-репорт|defect|дефект/.test(value)) return "Defect Management";
  if (/estimat|оцін/.test(value)) return "Test Estimation";
  if (/boundary|гранич|equivalence|decision table|test design|тест-дизайн/.test(value)) return "Test Design Techniques";
  if (/test plan|documentation|документ|test case|тест-кейс/.test(value)) return "Test Documentation";
  if (/priorit|risk|regression|регрес|exploratory|дослідниц/.test(value)) return "Test Management";
  if (/sql|database|баз[аи] даних/.test(value)) return "SQL and Databases";
  if (/devtools|browser|браузер|cors/.test(value)) return "Web Testing";
  if (/osi model|tcp\/ip model/.test(value)) return "OSI / TCP-IP";
  if (/dns|tcp|udp|ipv[46]|network|мереж|routing|switch|arp|dhcp|nat|quic|mtu|socket|firewall/.test(value)) return "Networking";
  if (/client-server|клієнт-сервер/.test(value)) return "Client-Server Architecture";
  if (/oauth|jwt|authentication|authorization|автентиф|авторизац/.test(value)) return "Authentication and Authorization";
  if (/security|secret|безпек|token|токен/.test(value)) return "Security Testing";
  if (/slow|latency|performance|навантаж|повільн/.test(value)) return "Performance Testing";
  if (/automation|автоматизац|test pyramid/.test(value)) return "Automation Testing";
  if (/microservice|мікросервіс/.test(value)) return "Microservices";
  if (/rest|graphql|soap/.test(value)) return "REST Architecture";
  if (/http|tls|ssl|status code|заголовк/.test(value)) return "HTTP / HTTPS";
  if (/api|json|websocket|protocol/.test(value)) return "API Testing";
  if (/redis|cache/.test(value)) return "Caching";
  if (/docker|container|network ports/.test(value)) return "Docker and Containers";
  if (/jenkins|ci\/cd|pipeline|deploy|release|infrastructure as code/.test(value)) return "CI/CD";
  if (/microservice|service|saga|distributed|consistency|cqrs|event|architecture|client-server|load balanc|migration|schema|component|monolith|scal/.test(value)) return "Distributed Systems";
  if (/git|devtools|postman|swagger|curl|sql/.test(value)) return "Tools & Technologies";
  if (/rabbit|kafka|broker|queue|черг/.test(value)) return "Message Brokers";
  if (/log|monitor|observability|trace|метрик/.test(value)) return "Logs and Monitoring";
  if (/debug|troubleshoot|diagnos|діагност|проблем|error|timeout|outage|відмов/.test(value)) return "Debugging and Troubleshooting";
  if (/test|qa|testing|тест|перевір/.test(value)) return "Fundamentals of Testing";
  return "Practical Testing Tasks";
}

const strongJuniorCategories = new Set([
  "Fundamentals of Testing", "Test Design Techniques", "Test Documentation",
  "Web Testing", "API Testing", "HTTP / HTTPS", "SQL and Databases",
  "Tools & Technologies", "Defect Management", "Practical Testing Tasks",
]);

function questionDifficulty(topic) {
  return strongJuniorCategories.has(questionCategory(topic)) ? "strong-junior" : "middle";
}

function questionComplexity(topic) {
  const text = `${topic.subject} ${topic.q}`.toLowerCase();
  if (/distributed|consistency|saga|cqrs|concurrent|parallel|race condition|failover|federation|multi-step|відмовостій|узгодженіст|конкурент|розподілен|транзакц|ідемпотент|повторн|ротац|маршрут|ізоляц/.test(text)) return 3;
  if (/як тест|як перевір|що тест|що перевір|як локал|як діагност|how would|what would|why|when|scenario|сценарій|одночас|паралельн/.test(text)) return 2;
  if (/різниц|відрізня|порівня|коли обрати|чим .* відрізн/.test(text)) return 1;
  return 0;
}

const questionCategoryOrder = [
  "Fundamentals of Testing", "Test Design Techniques", "Test Documentation",
  "Defect Management", "Web Testing", "Practical Testing Tasks",
  "API Testing", "HTTP / HTTPS", "REST Architecture", "SQL and Databases",
  "Tools & Technologies", "Test Management", "Test Estimation", "Automation Testing",
  "Caching", "Docker and Containers", "CI/CD", "Logs and Monitoring",
  "Security Testing", "Authentication and Authorization", "Performance Testing",
  "Networking", "OSI / TCP-IP", "Client-Server Architecture", "Microservices",
  "Message Brokers", "Distributed Systems", "Debugging and Troubleshooting",
];

function questionRecord(topic, orderIndex, contentIndex) {
  const source = sources.qa[0];
  const override = interviewOverrides[topic.subject];
  const detailedAnswer = override?.[1] || [
    topic.a,
    `${topic.fact} ${topic.nuance}`,
    `Практична перевірка може включати такі дії: ${topic.check}`,
    `Окрему увагу слід приділити ризику: ${topic.risk}`,
  ].join("\n\n");
  const question = override?.[0] || topic.q;
  const category = questionCategory(topic);
  return {
    slug: `interview-${slugPart(topic.subject)}-${contentIndex + 1}`, kind: "question", section: "interview",
    category, title: topic.subject, summary: question,
    body: detailedAnswer, question, answer: detailedAnswer,
    difficulty: questionDifficulty(topic),
    questionType: /як тест|як перевір|що тест|що перевір|як локал|як діагност|як послідовно|як відрізн|що слід|які перевір/i.test(question) ? "scenario" : "technical",
    orderIndex, sourceName: source.title, sourceUrl: source.url, sources: [source],
    tags: ["interview", category, topic.category, topic.subject], published: true,
  };
}

function seedRecords() {
  const sourceArchitectureTopics = [...networkingIndices.map((index) => topics[index]), ...networking];
  if (architectureOrder.length !== 50 || new Set(architectureOrder).size !== 50 || architectureOrder.some((index) => index < 0 || index >= sourceArchitectureTopics.length)) {
    throw new Error("Architecture article order must contain each of the 50 source articles exactly once.");
  }
  const architectureTopics = sourceArchitectureTopics.map((topic, stableIndex) => {
    const revision = networkingRevisions[topic.subject];
    return { ...topic, ...(revision ? { ...revision, articleTitle: revision.title, articleCategory: revision.category } : {}), stableIndex };
  }).sort((a, b) => architectureOrder.indexOf(a.stableIndex) - architectureOrder.indexOf(b.stableIndex));
  const toolTopics = technologyArticles.map((topic, index) => ({
    ...topic,
    articleSlug: `tools-${slugPart(topic.title) || "topic"}-${index + 1}`,
  }));
  const interviewExtras = [
    extra("Test Management", "Test estimation under changing scope", "An estimate is a forecast based on scope, uncertainty, dependencies, capacity and an agreed quality target.", "A single point estimate can hide uncertainty; state assumptions and use ranges or confidence when the work is uncertain.", "Break work into testable risks and activities, identify blocked dependencies, then revisit the estimate as evidence changes.", "Compare planned and actual effort by activity and ask which assumption changed instead of applying a blanket percentage.", "Giving a precise date without assumptions can be mistaken for a commitment and encourages cutting high-risk coverage silently.", "Функцію потрібно завершити за два дні, але контракт API та тестові дані ще змінюються. Як оцінити обсяг тестування?", "Уточніть межі функції та ризик випуску, перелічіть залежності й невідомі чинники, розбийте перевірки на конкретні роботи та оцініть їх діапазоном, а не одним удавано точним числом. Вкажіть, які задачі можна виконувати паралельно, і домовтеся, які нові факти змінять прогноз. Якщо обсяг і строк несумісні, відкрито погодьте компроміс із відповідальними учасниками, не приховуючи його через мовчазне скорочення перевірок із високим ризиком."),
    extra("Defect Management", "Severity versus priority in defect triage", "Severity describes impact on users or system behavior; priority communicates urgency and ordering for a team to address it.", "They are related but not identical: a low-severity typo on a release-critical page can be urgent, while a severe issue in an unused feature may be deferred with explicit risk acceptance.", "Describe affected users, frequency, workaround, data/security impact and release context before proposing triage values.", "Reproduce the issue, capture scope and workaround, then review severity and priority with product and engineering owners.", "Treating severity and priority as synonyms loses product context and creates inconsistent triage.", "Незначний візуальний дефект блокує контрактний запуск, тоді як серйозна помилка стосується вимкненої функції. Як оформите обидва випадки?", "Окремо оцініть вплив на користувачів і систему та терміновість для бізнесу. Наведіть докази, контекст випуску, коло користувачів і наявність обхідного шляху. Запропонуйте рівень серйозності й пріоритет згідно з правилами команди, після чого погодьте їх із відповідальними учасниками. Ризик відкладення серйозної помилки має бути явно прийнятий, а не прихований за низьким пріоритетом."),
    extra("Fundamentals of Testing", "Testing when acceptance criteria are incomplete", "Testing evaluates product risks and provides evidence; it cannot prove the absence of all defects or replace decisions about intended behavior.", "When requirements are unclear, observations must be separated from assumptions and confirmed with a product decision-maker.", "Turn ambiguity into explicit questions, model plausible user outcomes, and prioritize reversible, high-impact behavior while awaiting clarification.", "Record the assumption, test a positive and negative path, and confirm the expected result before treating a mismatch as a defect.", "Silently inventing acceptance criteria creates false defects and can hide genuine product gaps.", "Ви виявили непослідовну поведінку, але критерії приймання не визначають очікуваного результату. Як діятимете?", "Зафіксуйте фактичну поведінку та її вплив, опишіть можливі тлумачення й попросіть відповідального за продукт визначити очікуваний результат. Рішення та його обґрунтування потрібно задокументувати. До уточнення вимог можна перевіряти технічні інваріанти й пов'язані ризики, але припущення слід явно позначати, а не видавати за погоджену вимогу."),
    extra("Test Documentation", "Evidence that makes a defect reproducible", "A useful defect record connects a specific build and environment to repeatable steps, observed output, expected behavior and evidence.", "The artifact should be sufficient to reproduce the issue without copying credentials or unnecessary personal data.", "Capture request IDs, timestamps, sanitized payloads, exact setup and one minimal reproduction path.", "Have another engineer follow the steps using the stated build and data; confirm that attached logs match the same request.", "A screenshot alone may show an outcome but omit the trigger, state, request or environment needed to reproduce it.", "Які докази ви додасте до періодичної помилки API, яку не вдається відтворити щоразу?", "Зафіксуйте частоту й час прояву, середовище та версію збірки, очищені від чутливих даних запит і відповідь, ідентифікатор кореляції, відповідні записи журналу або трасування, передумови тестових даних і результат повторної спроби. Приховайте токени та персональні дані. Такий набір дає змогу зіставити клієнтське спостереження з конкретною операцією на сервері та відокремити нестабільність від помилки налаштування чи даних."),
    extra("Web Testing", "Browser storage and session boundaries", "Cookies, local storage and session storage have different scope, lifetime and browser request behavior; authentication designs rely on those differences.", "Cookie attributes such as Secure, HttpOnly and SameSite affect transmission and script access; storage contents may survive reloads or tabs differently.", "Test login, refresh, logout, expiry and multiple accounts in clean and existing browser profiles.", "Inspect storage before and after logout, open a second tab, and verify protected requests after token/session expiry.", "A UI logout that only navigates away while retaining valid credentials leaves the session active.", "Як перевірити, що вихід із системи справді завершує сеанс у браузері?", "Перевірте, чи анулює сервер сеанс або застосовує погоджену політику завершення строку дії токена, і чи видаляє клієнт облікові дані. Після виходу оновіть захищену сторінку, повторіть запит до API зі старими обліковими даними та перевірте іншу вкладку. Сервер має відхилити недійсний сеанс, а секрети не повинні залишатися у сховищі браузера всупереч вимогам системи."),
  ];
  const questionTopics = [...topics, ...networking, ...tools, ...interviewExtras]
    .map((topic, contentIndex) => ({ topic, contentIndex, category: questionCategory(topic), difficulty: questionDifficulty(topic), complexity: questionComplexity(topic) }))
    .sort((a, b) => {
      const level = (a.difficulty === "strong-junior" ? 0 : 1) - (b.difficulty === "strong-junior" ? 0 : 1);
      if (level) return level;
      const category = questionCategoryOrder.indexOf(a.category) - questionCategoryOrder.indexOf(b.category);
      return category || a.complexity - b.complexity || a.contentIndex - b.contentIndex;
    });
  if (architectureTopics.length !== 50 || toolTopics.length !== 50 || questionTopics.length < 100 || questionTopics.length > 150) {
    throw new Error(`Knowledge package counts mismatch: architecture=${architectureTopics.length}, tools=${toolTopics.length}, interview=${questionTopics.length}.`);
  }
  const records = [
    ...questionTopics.map(({ topic, contentIndex }, orderIndex) => questionRecord(topic, orderIndex, contentIndex)),
    ...architectureTopics.map((topic, index) => articleRecord("architecture", topic, index, topic.stableIndex)),
    ...toolTopics.map((topic, index) => articleRecord("tools", topic, index)),
  ];
  const slugs = new Set(records.map((record) => record.slug));
  if (slugs.size !== records.length) {
    const seen = new Set();
    throw new Error(`Knowledge content contains duplicate slugs: ${records.map((record) => record.slug).filter((slug) => seen.has(slug) || !seen.add(slug)).join(", ")}`);
  }
  return records;
}

async function seedKnowledge() {
  const records = seedRecords();
  await KnowledgeItem.sequelize.transaction(async (transaction) => {
    await KnowledgeItem.destroy({ where: { [Op.or]: [
      { slug: { [Op.like]: "fact-%" } }, { slug: { [Op.like]: "tip-%" } },
      { slug: { [Op.like]: "question-interview-%" } }, { slug: { [Op.like]: "article-%" } },
      { section: "tools", kind: "article" },
    ] }, transaction });
    const itemsToSeed = records.map(({ sources: _sources, related: _related, ...record }) => record);
    await KnowledgeItem.bulkCreate(itemsToSeed, {
      validate: true, transaction,
      updateOnDuplicate: ["kind", "section", "category", "title", "summary", "body", "question", "answer", "difficulty", "questionType", "orderIndex", "estimatedReadingTime", "sourceName", "sourceUrl", "tags", "published", "updatedAt"],
    });
    const seededItems = await KnowledgeItem.findAll({ where: { slug: records.map((record) => record.slug) }, attributes: ["id", "slug"] , transaction });
    const ids = seededItems.map((item) => item.id);
    await KnowledgeSource.destroy({ where: { knowledgeItemId: ids }, transaction });
    await KnowledgeRelation.destroy({ where: { sourceArticleId: ids }, transaction });
    const itemIds = new Map(seededItems.map((item) => [item.slug, item.id]));
    const sourceRecords = records.flatMap((record) => record.sources.map((source) => ({
      knowledgeItemId: itemIds.get(record.slug), title: source.title, url: source.url,
      type: source.type, description: source.description,
    })));
    if (sourceRecords.length) await KnowledgeSource.bulkCreate(sourceRecords, { validate: true, transaction, ignoreDuplicates: true });
    const technologyRecords = records.filter((record) => record.section === "tools" && record.kind === "article");
    const technologyByOrder = new Map(technologyRecords.map((record) => [record.orderIndex + 1, record]));
    const relationRecords = technologyRecords.flatMap((record) => (record.related || []).map((relation) => ({
      sourceArticleId: itemIds.get(record.slug), targetArticleId: itemIds.get(technologyByOrder.get(relation.target)?.slug),
      relationType: relation.type,
    })).filter((relation) => relation.sourceArticleId && relation.targetArticleId));
    if (relationRecords.length) await KnowledgeRelation.bulkCreate(relationRecords, { validate: true, transaction, ignoreDuplicates: true });
  });
  console.log(`Knowledge hub ready: ${records.filter((item) => item.section === "interview").length} questions and ${records.filter((item) => item.kind === "article").length} articles (50 architecture, 50 technologies).`);
  return records.length;
}

seedKnowledge.seedRecords = seedRecords;
module.exports = seedKnowledge;
