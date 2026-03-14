# Business Requirements Document (BRD): SRB-Context-Agent

**Verzija:** 1.0  
**Status:** Draft / Za razvoj  
**Projekat:** AI asistent za holističku analizu lokacija i poslovanja u Srbiji

---

## 1. Rezime projekta (Executive Summary)

Cilj projekta je razvoj inteligentnog agenta koji integriše javno dostupne podatke (APR, Katastar, Ekologija, Socijalna infrastruktura) u jedinstven interfejs. Umesto manuelnog pretraživanja više portala, korisnik putem prirodnog jezika dobija kompletnu sliku o mikro-lokaciji za stanovanje ili poslovanje.

---

## 2. Ciljevi biznis logike (Business Objectives)

- **Transparentnost:** Omogućiti uvid u pravni status nepokretnosti i kredibilitet investitora.
- **Kvalitet života (Micro-location Intelligence):** Analiza dostupnosti ključnih usluga (škole, vrtići, lekari) u krugu od X metara od posmatrane lokacije.
- **Zdravlje i okruženje:** Integracija podataka o zagađenju vazduha i zelenim površinama.

---

## 3. Ključne funkcionalnosti (Core Features)

### 3.1. Modul: "Pravna Čistota" (APR & Katastar)

- **Identifikacija:** Pretraga po adresi ili broju parcele (Geosrbija WFS).
- **Provera subjekta:** Automatsko povlačenje podataka o vlasniku/investitoru sa APR-a (status računa, blokade, pravna forma).
- **Zabeležbe:** Prikaz tereta ili zabeležbi na parceli (ukoliko je dostupno kroz otvorene setove).

### 3.2. Modul: "Životna Sredina" (Eco-Context)

- **Vazduh:** Real-time podaci sa najbliže SEPA ili građanske mjerne stanice (AQI indeks).
- **Buka i otpad:** Informacije o blizini industrijskih zona ili deponija (iz prostornih planova).

### 3.3. Modul: "Infrastruktura i Lifestyle" (Novo)

Ovaj modul rešava pitanje: *"Kako se ovde zapravo živi?"*

- **Obrazovanje:** Lista svih vrtića i škola u radijusu od 500m/1km, uključujući državne i privatne ustanove.
- **Zdravstvo:** Blizina domova zdravlja, bolnica i apoteka.
- **Logistika:** Blizina marketa, pošta, banaka i stajališta gradskog prevoza (GTFS podaci).
- **Lifestyle Score:** Automatski generisan "Walkability score" na osnovu blizine parkova i pešačkih zona.

---

## 4. Izvori podataka (Data Sources Strategy)

| Kategorija | Izvor | Metod |
|---|---|---|
| Pravni status | data.gov.rs / APR | CSV/JSON dumpovi ili Scraper |
| Prostorni podaci | Geosrbija (RGZ) | WFS / WMS servisi |
| Infrastruktura (POI) | OpenStreetMap (OSM) | Overpass API |
| Obrazovanje/Zdravstvo | data.gov.rs | Registar ustanova (Ministarstvo prosvete/zdravlja) |
| Vazduh | SEPA / xEco | Public API |

---

## 5. Tehnički zahtevi (Technical Requirements)

### 5.1. Geocoding & Entity Matching

- **Geocoding engine:** Nominatim ili Photon — konverzija tekstualnih adresa u GPS koordinate.
- **Cross-referencing:** Povezivanje naziva firme iz APR-a sa njenim sedištem na mapi.

### 5.2. AI Agent Layer

- **LLM:** Model sa velikim kontekstnim prozorom (Gemini 1.5 Flash/Pro).
- **Function Calling:** Agent mora znati kada da pozove alat za pretragu škola, a kada za proveru APR statusa.
- **Vektorska baza:** Za čuvanje statičkih podataka o školama i bolnicama radi brže pretrage (Pinecone ili lokalni FAISS/ChromaDB).

---

## 6. Korisnički Scenario (User Story)

> *"Pronašao sam stan u ulici Rade Končara. Proveri mi da li je investitor pouzdan, kakav je vazduh tamo i da li ima državni vrtić u blizini koji nije prebukiran."*

**Odgovor Agenta:**

- **Investitor:** Firma X, aktivna 5 godina, nema blokade u poslednjih 365 dana.
- **Vazduh:** Trenutni AQI je 45 (Odlično), najbliža stanica je na 300m.
- **Vrtić:** Postoje 2 državna vrtića na 400m i 600m. *(Opciono: link ka portalu "E-uprava" za proveru mesta)*
- **Bonus:** Ulica je ocenjena kao "tiha zona", sa dosta zelenila u okruženju.

---

## 7. Preporuka za prvi koderski zadatak

Fokus na **Data Ingestion** kao polaznu tačku. Python skripta koja koristi `overpass` biblioteku za ekstrakciju POI objekata po koordinatama (lat, lon):

```
amenity=school
amenity=kindergarten
amenity=doctors
amenity=pharmacy
```

Ovo je "srce" Lifestyle modula. Zatim se CSV fajlovi sa `data.gov.rs` mogu koristiti za obogaćivanje podataka (tip škole, specijalizacija, itd.).

Stack preporuka: **FastAPI** za API sloj, **Gemini Flash** za agent logiku — u okviru Gemini Paid paketa ima dovoljno kapaciteta za kompleksne agent pipeline-ove.
