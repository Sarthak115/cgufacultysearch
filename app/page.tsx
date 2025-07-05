"use client"

import { useState, useMemo } from "react"
import { Search, Mail, Phone, User, GraduationCap, MapPin, Users, Building, Crown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Faculty {
  name: string
  personalEmail: string
  officialEmail: string
  phone: string[]
  department: string
  designation: string
}

const facultyData: Faculty[] = [
  // Computer Science Department
  {
    name: "MAMATARANI DAS",
    personalEmail: "mamataparida2005@gmail.com",
    officialEmail: "mamatadas@cgu-odisha.ac.in",
    phone: ["8895078514"],
    department: "Computer Science",
    designation: "Assistant Professor",
  },
  {
  name: "Ganapati Panda",
  personalEmail: "",
  officialEmail: "",
  phone: ["+91 9437048906"],
  department: "CSE",
  designation: ""
},
{
  name: "Dr. Biji Nair",
  personalEmail: "",
  officialEmail: "biji.nair@cgu-odisha.ac.in",
  phone: ["+91 9400430262"],
  department: "CSE",
  designation: ""
},
{
  name: "Dr. Prabhat Dansena",
  personalEmail: "",
  officialEmail: "prabhat.dansena@cgu-odisha.ac.in",
  phone: ["+91 9704491705"],
  department: "",
  designation: "Asst. Prof."
},
{
  name: "Dr. Raj Vikram",
  personalEmail: "",
  officialEmail: "raj.vikram@cgu-odisha.ac.in",
  phone: ["+91 8966009393"],
  department: "",
  designation: "Asst. Prof."
},
{
  name: "Dr. Shubham Yadav",
  personalEmail: "",
  officialEmail: "subham.ydv@cgu-odisha.ac.in",
  phone: ["+91 9179197916"],
  department: "CSE",
  designation: "Assistant Professor"
},
{
  name: "Dr. Sumana  De",
  personalEmail: "",
  officialEmail: "sumana.de@cgu-odisha.ac.in",
  phone: ["+91 8967260810"],
  department: "CSE",
  designation: "Assistant Professor"
},
{
  name: "Dr. Siba Mishra",
  personalEmail: "",
  officialEmail: "siba.mishra@cgu-odisha.ac.in",
  phone: ["+91 9437160656"],
  department: "CSE",
  designation: "Assistant Professor"
},
{
  name: "Dr. Priya Mishra",
  personalEmail: "",
  officialEmail: "priya.mishra@cgu-odisha.ac.in",
  phone: ["+91 8280252696"],
  department: "CSE",
  designation: "Assistant Professor"
},
{
  name: "Subrasmita Gouda",
  personalEmail: "",
  officialEmail: "subrasmita.gouda@cgu-odisha.ac.in",
  phone: ["+91 9078766256"],
  department: "CSE",
  designation: "Assistant Professor"
},

{
  name: "Manaswini Nayak",
  personalEmail: "",
  officialEmail: "manaswini.nayak@cgu-odisha.ac.in",
  phone: ["+91 9348812479"],
  department: "CSE",
  designation: "Assistant Professor"
},

{
  name: "Dr. Mamata Das",
  personalEmail: "",
  officialEmail: "mamata.das@cgu-odisha.ac.in",
  phone: ["+91 8240169206"],
  department: "CSE",
  designation: "Assistant Professor"
},
{
  name: "Dr. Mamata Sahu",
  personalEmail: "",
  officialEmail: "mamata.sahu@cgu-odisha.ac.in",
  phone: ["+91 9910057850"],
  department: "CSE",
  designation: "Assistant Professor"
},

{
  name: "Dr. Ashish Ranjan",
  designation: "Asst. Prof.",
  personalEmail: "-",
  officialEmail: "ashish.ranjan@cgu-odisha.ac.in",
  phone: ["+91 7261027290"],
  department: "CSE"
},
{
    name: "Anjana Mishra",
    designation: "Asst. Prof.",
    personalEmail: "anjanamishra21841@gmail.com",
    officialEmail: "anjana.mishra@cgu-odisha.ac.in",
    phone: ["+91 7682951028"],
    department: "CSE"
  },
  {
    name: "Dr. Madhusmita Sahu",
    designation: "Asst. Prof. & HOD",
    personalEmail: "madhusaina@gmail.com",
    officialEmail: "msahu@cgu-odisha.ac.in",
    phone: ["+91 9861131244"],
    department: "CSE"
  },

  {
  name: "Dr. Adyasha Rath",
  designation: "Asst. Prof.",
  personalEmail: "adyasharath1996@gmail.com",
  officialEmail: "adyasha.rath@cgu-odisha.ac.in",
  phone: ["9337414974"],
  department: "CSE"
},


{
  name: "Dr. Dillip Rout",
  designation: "Associate Professor",
  personalEmail: "",
  officialEmail: "dillip.rout@cgu-odisha.ac.in",
  phone: ["9619589827"],
  department: "CSE"
},



  {
    name: "MANAS RANJAN MISHRA",
    personalEmail: "manascvrce@gmail.com",
    officialEmail: "manascse@cgu-odisha.ac.in",
    phone: ["8018020262"],
    department: "Computer Science",
    designation: "Assistant Professor",
  },
  {
    name: "MONALISA MISHRA",
    personalEmail: "monalisa.mishra85@gmail.com",
    officialEmail: "mmishra@cgu-odisha.ac.in",
    phone: ["7978107808", "9439733033"],
    department: "Computer Science",
    designation: "Assistant Professor",
  },
  {
    name: "SOUMYA SAHOO",
    personalEmail: "soumya.sahoo685@gmail.com",
    officialEmail: "soumya.sahoo@cgu-odisha.ac.in",
    phone: ["9861775097", "9337084441"],
    department: "Computer Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. ROJALINA PRIYADARSHINI",
    personalEmail: "priyadarshini.rojalina@gmail.com",
    officialEmail: "rojalinapriyadarshini@cgu-odisha.ac.in",
    phone: ["9437937546"],
    department: "Computer Science",
    designation: "Associate Professor",
  },
  {
    name: "DR. SUKANTA KISHORE BISOY",
    personalEmail: "sukantabisoyi@yahoo.com",
    officialEmail: "sukantabisoyi@cgu-odisha.ac.in",
    phone: ["6370046155"],
    department: "Computer Science",
    designation: "Professor",
  },
  {
    name: "DR. SURENDRA KUMAR NANDA",
    personalEmail: "situnanda@gmail.com",
    officialEmail: "surendra.nanda@cgu-odisha.ac.in",
    phone: ["7008859314"],
    department: "Computer Science",
    designation: "Professor",
  },
  {
    name: "DR. RAKESH RANJAN KUMAR",
    personalEmail: "rakeshranjan.cdac@gmail.com",
    officialEmail: "rakeshranjan@cgu-odisha.ac.in",
    phone: ["7070254486"],
    department: "Computer Science",
    designation: "Associate Professor",
  },
  {
    name: "DR. SAMPA SAHOO",
    personalEmail: "sampasahoo.nitr@gmail.com",
    officialEmail: "sampa.sahoo@cgu-odisha.ac.in",
    phone: ["9861749144"],
    department: "Computer Science",
    designation: "Professor",
  },
  {
    name: "DR. PRAMOD KUMAR MEHER",
    personalEmail: "pkmeher@gmail.com",
    officialEmail: "pramod.meher@cgu-odisha.ac.in",
    phone: ["9938724841"],
    department: "Computer Science",
    designation: "Professor",
  },
  {
    name: "DR. MAMATA WAGH",
    personalEmail: "mamtacse7@gmail.com",
    officialEmail: "mamata.wagh@cgu-odisha.ac.in",
    phone: ["9778455813"],
    department: "Computer Science",
    designation: "Associate Professor",
  },
  {
    name: "DR. BICHITRANANDA BEHERA",
    personalEmail: "bbehera19@gmail.com",
    officialEmail: "bichitrananda.b@cgu-odisha.ac.in",
    phone: ["8658512232"],
    department: "Computer Science",
    designation: "Associate Professor",
  },
  {
    name: "DR. DEBENDRA MUDULI",
    personalEmail: "muduli.debendra@gmail.com",
    officialEmail: "debendra.muduli@cgu-odisha.ac.in",
    phone: ["9778455813"],
    department: "Computer Science",
    designation: "Associate Professor",
  },
  {
    name: "SHUBHAJIT PANDA",
    personalEmail: "shubhajitpnd11@gmail.com",
    officialEmail: "shubhajit.panda@cgu-odisha.ac.in",
    phone: ["8619810614"],
    department: "Computer Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. RAM CHANDRA BARIK",
    personalEmail: "ramchbarik@gmail.com",
    officialEmail: "ram.chandra@cgu-odisha.ac.in",
    phone: ["8280211343"],
    department: "Computer Science",
    designation: "Associate Professor",
  },
  {
    name: "SWATISIPRA DAS",
    personalEmail: "ssdas2022@gmail.com",
    officialEmail: "swatisipra.das@cgu-odisha.ac.in",
    phone: ["6371709095"],
    department: "Computer Science",
    designation: "Assistant Professor",
  },
  {
    name: "ASHUTOSH SONI",
    personalEmail: "asonibgh@gmail.com",
    officialEmail: "ashutosh.soni@cgu-odisha.ac.in",
    phone: ["7008970861"],
    department: "Computer Science",
    designation: "Assistant Professor",
  },


{
  name: "DR. PRIYANKA SAHA",
  personalEmail: "",
  officialEmail: "priyanka.saha@cgu-odisha.ac.in",
  phone: ["9883646012"],
  department: "Computer Science",
  designation: "Assistant Professor",
},
{
  name: "MS. B. NIVEDITA DASH",
  personalEmail: "bniveditadash@gmail.com",
  officialEmail: "nivedita.dash@cgu-odisha.ac.in",
  phone: ["9114465436"],
  department: "Computer Science",
  designation: "Teaching Assistant",
},
{
  name: "MS. SWAGATIKA SAHOO",
  personalEmail: "swagatika.sahoo1609@gmail.com",
  officialEmail: "swagatika.sahoo@cgu-odisha.ac.in",
  phone: ["8763872702"],
  department: "Computer Science",
  designation: "Teaching Assistant",
},
{
  name: "MS. BARSHA MISHRA",
  personalEmail: "barshamishra2000@gmail.com",
  officialEmail: "barsha.mishra@cgu-odisha.ac.in",
  phone: ["9348550874"],
  department: "Computer Science",
  designation: "Teaching Assistant",
},
{
  name: "MS. SUCHITRA DEBATA",
  personalEmail: "suchitra732000@gmail.com",
  officialEmail: "suchitra.debata@cgu-odisha.ac.in",
  phone: ["7873591932"],
  department: "Computer Science",
  designation: "Teaching Assistant",
},
{
  name: "MS. SONALI PRIYADARSHINI MOHAPATRA",
  personalEmail: "sonalimohapatra512@gmail.com",
  officialEmail: "sonalip.mohapatra@cgu-odisha.ac.in",
  phone: ["8328829294"],
  department: "Computer Science",
  designation: "Teaching Assistant",
},
{
  name: "MR. KARTICK SWAIN",
  personalEmail: "kartickswain18@gmail.com",
  officialEmail: "kartick.swain@cgu-odisha.ac.in",
  phone: ["6371050543"],
  department: "Computer Science",
  designation: "Teaching Assistant",
},
{
  name: "MR. AJAYA NARAYAN NAYAK",
  personalEmail: "ajayanarayannayak@gmai.com",
  officialEmail: "ajayanarayan.nayak@cgu-odisha.ac.in",
  phone: ["8327722671"],
  department: "Computer Science",
  designation: "Teaching Assistant",
},
{
  name: "MR. KAMALAKANTA ROUT",
  personalEmail: "krout1467@gmail.com",
  officialEmail: "kamalakanta.rout@cgu-odisha.ac.in",
  phone: ["9348589204"],
  department: "Computer Science",
  designation: "Teaching Assistant",
},
{
  name: "MR. KRISHNA KINKER SAHOO",
  personalEmail: "krishnakinkersahoo@gmail.com",
  officialEmail: "krishnakinker.sahoo@cgu-odisha.ac.in",
  phone: ["6370353261"],
  department: "Computer Science",
  designation: "Teaching Assistant",
},
{
  name: "DR. SARADA PRASAD GOCHHAYAT",
  personalEmail: "",
  officialEmail: "saradaprasad.gochhayat@cgu-odisha.ac.in",
  phone: ["9078313063"],
  department: "Computer Science",
  designation: "Assistant Professor (SG)",
},
{
  name: "DR. MOHD. ISHTIYAQ QURESHI",
  personalEmail: "",
  officialEmail: "mohammad.qureshi@cgu-odisha.ac.in",
  phone: ["7807371088"],
  department: "Computer Science",
  designation: "Assistant Professor",
},
{
  name: "DR. SHAKEEL AHAMAD",
  personalEmail: "",
  officialEmail: "ahamad.shakeel@cgu-odisha.ac.in",
  phone: ["9675172604"],
  department: "Computer Science",
  designation: "Assistant Professor",
},
{
  name: "DR. PRIYANKA KUMARI",
  personalEmail: "",
  officialEmail: "priyanka.kumari@cgu-odisha.ac.in",
  phone: ["7545002522"],
  department: "Computer Science",
  designation: "Assistant Professor",
},
{
  name: "MR. KANHU CHARAN MOHANTY",
  personalEmail: "",
  officialEmail: "kanhucharan.mohanty@cgu-odisha.ac.in",
  phone: ["8249972857"],
  department: "Computer Science",
  designation: "Assistant Professor",
},
{
  name: "MS. SUCHITRA MOHANTY",
  personalEmail: "",
  officialEmail: "suchitra.mohanty@cgu-odisha.ac.in",
  phone: ["9078065843"],
  department: "Computer Science",
  designation: "Assistant Professor",
},
{
  name: "CHANDAN KUMAR PANDA",
  personalEmail: "chandankumarpanda@gmail.com",
  officialEmail: "chandank.panda@cgu-odisha.ac.in",
  phone: ["7008922390"],
  department: "Computer Science",
  designation: "Assistant Professor",
},
{
  name: "SUPRIYA PANIGRAHY",
  personalEmail: "supriyapanigrahy1996.sp@gmail.com",
  officialEmail: "",
  phone: ["7978942992"],
  department: "Computer Science",
  designation: "Assistant Professor",
},
{
  name: "MRUTYUNJAYA SATHUA",
  personalEmail: "mrutyunjayasathua99@gmail.com",
  officialEmail: "mrutyunjaya.sathua@cgu-odisha.ac.in",
  phone: ["7008228479"],
  department: "Computer Science",
  designation: "Assistant Professor",
},
{
  name: "PRITI PRIYADARSANI PRADHAN",
  personalEmail: "priti.priyadarsani@gmail.com",
  officialEmail: "",
  phone: ["9668161448"],
  department: "Computer Science",
  designation: "Assistant Professor",
},
{
  name: "SMITA RANI BISWAL",
  personalEmail: "smitaranibiswal22@gmail.com",
  officialEmail: "",
  phone: ["9337761675", "8327751233"],
  department: "Computer Science",
  designation: "Assistant Professor",
},
{
  name: "SWETA SAHA",
  personalEmail: "swetasaha6348@gmail.com",
  officialEmail: "sweta.saha@cgu-odisha.ac.in",
  phone: ["8260828202"],
  department: "Computer Science",
  designation: "Assistant Professor",
},
{
  name: "DR. YOGOMAYA MOHAPATRA",
  personalEmail: "mohapatrayogomaya@gmail.com",
  officialEmail: "yogomaya.mohapatra@cgu-odisha.ac.in",
  phone: ["7978084715"],
  department: "Computer Science",
  designation: "Assistant Professor",
},
{
  name: "SUSHREE MAHESWARI SAHOO",
  personalEmail: "maheswari.joranda@gmail.com",
  officialEmail: "sushree.maheswari@cgu-odisha.ac.in",
  phone: ["8327712542"],
  department: "Computer Science",
  designation: "Assistant Professor",
},
{
  name: "TAPASWINI PANDA",
  personalEmail: "tapaswini99panda@gmail.com",
  officialEmail: "",
  phone: ["9938092266"],
  department: "Computer Science",
  designation: "Assistant Professor",
},
{
  name: "JYOTI RANJAN SWAIN",
  personalEmail: "jyotiranjanswain3181@gmail.com",
  officialEmail: "jyotiranjan.swain@cgu-odisha.ac.in",
  phone: ["7978728970"],
  department: "Computer Science",
  designation: "Assistant Professor",
},
{
  name: "ABHIPSA MAHALA",
  personalEmail: "avimamun50@gmail.com",
  officialEmail: "abhipsa.mahala@cgu-odisha.ac.in",
  phone: ["7381337607"],
  department: "Computer Science",
  designation: "Assistant Professor",
},
{
  name: "BIJNAN BISWAL",
  personalEmail: "bijnanbiswal@gmail.com",
  officialEmail: "bijnan.biswal@cgu-odisha.ac.in",
  phone: ["9777239295"],
  department: "Computer Science",
  designation: "Assistant Professor",
},
{
  name: "MS. JAYANTI ROUT",
  personalEmail: "routjayanti2k19@gmail.com",
  officialEmail: "jayanti.rout@cgu-odisha.ac.in",
  phone: ["8117883149"],
  department: "Computer Science",
  designation: "Assistant Professor",
},



  
  {
    name: "MANISH KUMAR MEHER",
    personalEmail: "19msccs04@suiit.ac.in",
    officialEmail: "manish.meher@cgu-odisha.ac.in",
    phone: ["7681083054"],
    department: "Computer Science",
    designation: "Assistant Professor",
  },
  {
    name: "SANCHITA MOHANTY",
    personalEmail: "sanchitamohanty08@gmail.com",
    officialEmail: "",
    phone: ["7008948762", "9776838866"],
    department: "Computer Science",
    designation: "Assistant Professor",
  },
  {
    name: "SIBANI BARAL",
    personalEmail: "sibanibaral25@gmail.com",
    officialEmail: "",
    phone: ["7978643327", "7008244095"],
    department: "Computer Science",
    designation: "Assistant Professor",
  },



  
  // Chemical Engineering Department
  {
    name: "DR. DEBARPITA GHOSAL",
    personalEmail: "ghosal.debarpita@gmail.com",
    officialEmail: "ghosal.debarpita@cgu-odisha.ac.in",
    phone: ["7205545986"],
    department: "Chemical Engineering",
    designation: "Assistant Professor",
  },
  {
    name: "RUDRA NARAYAN MOHAPATRA",
    personalEmail: "rudra.smart@gmail.com",
    officialEmail: "rudra@cgu-odisha.ac.in",
    phone: ["8093014956", "6371342540"],
    department: "Chemical Engineering",
    designation: "Assistant Professor",
  },

  // Civil Engineering Department
  {
    name: "SASANKA SEKHAR MOHANTY",
    personalEmail: "sasankosm@hotmail.com",
    officialEmail: "ssmohanty@cgu-odisha.ac.in",
    phone: ["9437206204"],
    department: "Civil Engineering",
    designation: "Professor",
  },
  {
    name: "DR. ABHISEKH SAHA",
    personalEmail: "abhisekh.iitg@gmail.com",
    officialEmail: "abhisekh.saha@cgu-odisha.ac.in",
    phone: ["7896880405"],
    department: "Civil Engineering",
    designation: "Assistant Professor",
  },
  {
    name: "DR. BIRAJ PRASAD MISHRA",
    personalEmail: "birajaprmishra@gmail.com",
    officialEmail: "birajaprasad.mishra@cgu-odisha.ac.in",
    phone: ["7008493524"],
    department: "Civil Engineering",
    designation: "Assistant Professor (SG)",
  },
  {
    name: "DR. RAJARAMA MOHAN JENA",
    personalEmail: "",
    officialEmail: "rajarama.jena@cgu-odisha.ac.in",
    phone: ["7873347158"],
    department: "Civil Engineering",
    designation: "Assistant Professor",
  },
  {
    name: "SWAGATO DAS",
    personalEmail: "swagatodas83@gmail.com",
    officialEmail: "swagato@cgu-odisha.ac.in",
    phone: ["7381275424"],
    department: "Civil Engineering",
    designation: "Assistant Professor",
  },
  {
    name: "KRISHNA PADA BAURI",
    personalEmail: "kb13@iitbbs.ac.in",
    officialEmail: "kb13@cgu-odisha.ac.in",
    phone: ["9937863943"],
    department: "Civil Engineering",
    designation: "Assistant Professor",
  },
  {
    name: "DR. JANARUL SHAIKH",
    personalEmail: "janarul@gmail.com",
    officialEmail: "jshaikh@cgu-odisha.ac.in",
    phone: ["9678027298", "421919033201"],
    department: "Civil Engineering",
    designation: "Assistant Professor",
  },

  // Electrical Engineering Department
  {
    name: "DR. KARTIK CHANDRA PATRA",
    personalEmail: "kcpatra47@rediffamil.com",
    officialEmail: "kartik.chandra.patra@cgu-odisha.ac.in",
    phone: [""],
    department: "Electrical Engineering",
    designation: "Professor & Director",
  },
  {
  name: "DR. MADHUSUDAN MAITI",
  personalEmail: "",
  officialEmail: "",
  phone: ["9475301132"],
  department: "Electrical",
  designation: "Associate Professor",
},

  {
    name: "PRIYANKA SEN",
    personalEmail: "psen466@gmail.com",
    officialEmail: "s.priyanka@cgu-odisha.ac.in",
    phone: [""],
    department: "Electrical Engineering",
    designation: "Assistant Professor",
  },
  {
    name: "RAJAT KUMAR SAMANTARAY",
    personalEmail: "rajat.samantaray@gmail.com",
    officialEmail: "rajatsamantaray@cgu-odisha.ac.in",
    phone: [""],
    department: "Electrical Engineering",
    designation: "Assistant Professor",
  },
  {
    name: "RUPALI BALABANTARAYA",
    personalEmail: "rupali.cvrce@gmail.com",
    officialEmail: "rupali@cgu-odisha.ac.in",
    phone: [""],
    department: "Electrical Engineering",
    designation: "Assistant Professor",
  },
  {
    name: "SUSHREE S. PATTANAIK",
    personalEmail: "ealina.nist@gmail.com",
    officialEmail: "ssp5369@cgu-odisha.ac.in",
    phone: [""],
    department: "Electrical Engineering",
    designation: "Assistant Professor",
  },
  {
    name: "SWAPAN KUMAR BALL",
    personalEmail: "swapanball@yahoo.co.in",
    officialEmail: "skball@cgu-odisha.ac.in",
    phone: [""],
    department: "Electrical Engineering",
    designation: "Assistant Professor",
  },
  {
    name: "MANISH KUMAR SHARMA",
    personalEmail: "mks16991@gmail.com",
    officialEmail: "mksharma@cgu-odisha.ac.in",
    phone: [""],
    department: "Electrical Engineering",
    designation: "Assistant Professor",
  },
  {
    name: "NABADEEP PATRA",
    personalEmail: "nabadeep77@gmail.com",
    officialEmail: "pnabadeep@cgu-odisha.ac.in",
    phone: [""],
    department: "Electrical Engineering",
    designation: "Assistant Professor",
  },

  // Marine Engineering Department
  {
    name: "MRUTYUNJAYA MOHAPATRA",
    personalEmail: "",
    officialEmail: "",
    phone: ["9861144654"],
    department: "Marine Engineering",
    designation: "Professor",
  },
  {
    name: "MR. SURESH KUMAR PATRA",
    personalEmail: "",
    officialEmail: "",
    phone: ["9437400864"],
    department: "Marine Engineering",
    designation: "Professor",
  },

  // Physics Department
  {
    name: "DR. HIRANMAYEE MOHAPATRA",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Physics",
    designation: "Associate Professor & HOD",
  },
  {
    name: "DR. SABYASACHI PARIDA",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Physics",
    designation: "Associate Professor",
  },
  {
    name: "DR. TANMAYA BADAPANDA",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Physics",
    designation: "Associate Professor",
  },
  {
    name: "DR. SUNIRMAL SAHA",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Physics",
    designation: "Assistant Professor",
  },
  {
    name: "DR. RAHUL BARMAN",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Physics",
    designation: "Assistant Professor",
  },
  {
    name: "DR. SURYA PRAKASH GHOSH",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Physics",
    designation: "Assistant Professor",
  },
  {
    name: "DR. DHRUBOJYOTI ROY",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Physics",
    designation: "Assistant Professor",
  },
  {
    name: "DR. JAYANTA BERA",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Physics",
    designation: "Assistant Professor",
  },
  {
    name: "DR. SUBINOY ROY",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Physics",
    designation: "Assistant Professor",
  },
  {
    name: "DR. MOHUA CHAKRABORTY",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Physics",
    designation: "Assistant Professor",
  },

  // Chemistry Department
  {
    name: "DR. JAYASHREE MOHANTY",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Chemistry",
    designation: "Associate Professor",
  },
  {
    name: "DR. PRANAB KISHOR MOHAPATRA",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Chemistry",
    designation: "Assistant Professor",
  },
  {
    name: "DR. SHUBHRA BIKASH MAITY",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Chemistry",
    designation: "Assistant Professor",
  },
  {
    name: "DR. SOUMEN GIRI",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Chemistry",
    designation: "Assistant Professor",
  },
  {
    name: "DR. GULMI CHAKRABORTY",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Chemistry",
    designation: "Assistant Professor",
  },
  {
    name: "DR. TAPAS GUCHHAIT",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Chemistry",
    designation: "Assistant Professor",
  },
  {
    name: "DR. SANDEEPAN MAITY",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Chemistry",
    designation: "Assistant Professor",
  },
{
  name: "Dr. Debarpita Ghosal",
  personalEmail: "ghosal.debarpita@gmail.com",
  officialEmail: "ghosal.debarpita@cgu-odisha.ac.in",
  phone: ["7205545986"],
  department: "Chemistry",
  designation: "Associate Professor",
},

  // Mathematics Department
  {
    name: "DR. AMARESH CHANDRA PANDA",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Mathematics",
    designation: "Associate Professor",
  },
  {
    name: "DR. INDIRA ROUTRAY",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Mathematics",
    designation: "Associate Professor",
  },
  {
    name: "KAMAL LOCHAN MOHANTA",
    personalEmail: "",
    officialEmail: "kamallochanmahanta@cgu-odisha.ac.in",
    phone: [""],
    department: "Mathematics",
    designation: "Professor",
  },
  {
    name: "DR. PRASANT KUMAR NAYAK",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Mathematics",
    designation: "Assistant Professor",
  },
  {
    name: "DR. PRASHANTA KUMAR PARIDA",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Mathematics",
    designation: "Assistant Professor",
  },
  {
    name: "DR. TRAILOKYA NATH SINGH",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Mathematics",
    designation: "Associate Professor",
  },
  {
    name: "DR. GANESWAR MAHANTA",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Mathematics",
    designation: "Assistant Professor",
  },
  {
    name: "DR. SIVA PRASAD BEHERA",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Mathematics",
    designation: "Assistant Professor",
  },
  {
    name: "DR. HEMANTA MANDAL",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Mathematics",
    designation: "Assistant Professor",
  },
  {
    name: "DR STUTI AWASTHI",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Mathematics",
    designation: "Assistant Professor",
  },
  {
    name: "DR. SUBHASHREE PATEL",
    personalEmail: "",
    officialEmail: "",
    phone: [""],
    department: "Mathematics",
    designation: "Assistant Professor",
  },
//mechanical
{
  name: "DR. HILLOL JOARDAR",
  personalEmail: "joardar.2011@gmail.com",
  officialEmail: "jhillol@cgu-odisha.ac.in",
  phone: ["7008687893"],
  department: "Mechanical",
  designation: "Associate Professor",
},
{
  name: "MANOJ KUMAR NAYAK",
  personalEmail: "manoj.nayak14679@gmail.com",
  officialEmail: "manoj.kumar.nayak@cgu-odisha.ac.in",
  phone: ["9040930339"],
  department: "Mechanical",
  designation: "Assistant Professor",
},
{
  name: "DR. MANOJ KUMAR PARIDA",
  personalEmail: "manojparida337@gmail.com",
  officialEmail: "manojparida@cgu-odisha.ac.in",
  phone: ["9337424436"],
  department: "Mechanical",
  designation: "Assistant Professor",
},
{
  name: "DR. NITAI SUNDAR DAS",
  personalEmail: "ns_das2000@yahoo.co.in",
  officialEmail: "nsdas@cgu-odisha.ac.in",
  phone: ["9437390536"],
  department: "Mechanical",
  designation: "Professor",
},
{
  name: "DR. SACHINDRA KUMAR ROUT",
  personalEmail: "sachindra106@gmail.com",
  officialEmail: "sachindrarout@cgu-odisha.ac.in",
  phone: ["8895815648"],
  department: "Mechanical",
  designation: "Associate Professor",
},
{
  name: "DR. SUNITA ROUTRAY",
  personalEmail: "sunitaroutray77@gmail.com",
  officialEmail: "sroutray1@cgu-odisha.ac.in",
  phone: ["8895389315"],
  department: "Mechanical",
  designation: "Associate Professor",
},
{
  name: "PANKAJ KUMAR",
  personalEmail: "pankaj.mit.mech@gmail.com",
  officialEmail: "pkumar@cgu-odisha.ac.in",
  phone: ["8083476212"],
  department: "Mechanical",
  designation: "Assistant Professor",
},
{
  name: "DR. SUSHOVAN BASAK",
  personalEmail: "sushovanbasak@gmail.com",
  officialEmail: "s.basak@cgu-odisha.ac.in",
  phone: ["9433345626"],
  department: "Mechanical",
  designation: "Assistant Professor",
},
{
  name: "MADHU KALYAN REDDY PULAGAM",
  personalEmail: "pmadhukalyan@gmail.com",
  officialEmail: "pmkreddy@cgu-odisha.ac.in",
  phone: ["8500515185"],
  department: "Mechanical",
  designation: "Assistant Professor",
},
{
  name: "DR. BIKASH CHANDRA BEHERA",
  personalEmail: "bikashchbehera@cgu-odisha.ac.in",
  officialEmail: "bikashchbehera@cgu-odisha.ac.in",
  phone: ["9716198279"],
  department: "Mechanical",
  designation: "Assistant Professor",
},
{
  name: "DR. PRASANT KUMAR SWAIN",
  personalEmail: "prasant270910@gmail.com",
  officialEmail: "",
  phone: ["8260006213", "8895502091"],
  department: "Aerospace Engineering",
  designation: "Assistant Professor",
},
{
  name: "DR. SHAIK MOZAMMIL",
  personalEmail: "",
  officialEmail: "shaik.mozammil@cgu-odisha.ac.in",
  phone: ["9557987014"],
  department: "Mechanical",
  designation: "Assistant Professor",
},
{
  name: "DR. RAKESH RANJAN CHAND",
  personalEmail: "",
  officialEmail: "rakeshranjan.chand@cgu-odisha.ac.in",
  phone: ["9439916314"],
  department: "Mechanical",
  designation: "Assistant Professor",
},
{
  name: "DR. PRAVAJYOTI PATRA",
  personalEmail: "",
  officialEmail: "pravajyoti.patra@cgu-odisha.ac.in",
  phone: ["8339850706"],
  department: "Mechanical",
  designation: "Assistant Professor",
},

  // Higher Officials - Updated with real data
  {
    name: "PROF (DR.) GUDA SRIDEVI",
    personalEmail: "",
    officialEmail: "provicechancellor@cgu-odisha.ac.in",
    phone: ["8093998574", "7981419273"],
    department: "Administration",
    designation: "Pro Vice Chancellor",
  },
  {
    name: "PROF (DR.) BANSHIDHAR MAJHI",
    personalEmail: "",
    officialEmail: "vc@cgu-odisha.ac.in",
    phone: ["7852935680", "9437221124"],
    department: "Administration",
    designation: "Vice Chancellor",
  },
  {
    name: "DR. ACHYUTANANDA MOHANTY",
    personalEmail: "anmohanty@yahoo.com",
    officialEmail: "coe@cgu-odisha.ac.in",
    phone: ["9437053583"],
    department: "Administration",
    designation: "Controller of Examinations",
  },

  // Deans
  {
    name: "PROF. (DR.) ASHWIN SAHOO",
    personalEmail: "",
    officialEmail: "ashwinsahoo@cgu-odisha.ac.in",
    phone: ["7978413289"],
    department: "Engineering & Technology",
    designation: "Dean, Faculty of Engineering & Technology",
  },
  {
    name: "KAMAL LOCHAN MOHANTA",
    personalEmail: "",
    officialEmail: "kamallochanmahanta@cgu-odisha.ac.in",
    phone: [""],
    department: "Physical & Mathematical Science",
    designation: "Dean, Faculty of Physical & Mathematical Science",
  },
  {
    name: "PROF. (DR.) PRAGYAN PARAMITA PATTANAIK",
    personalEmail: "",
    officialEmail: "pragyan.pattnaik@cgu-odisha.ac.in",
    phone: ["7682899812"],
    department: "Humanities & Social Science",
    designation: "Dean, Faculty of Humanities & Social Science",
  },
  {
    name: "DR. SUKANT KISHORE BISOYI",
    personalEmail: "sukantabisoyi@yahoo.com",
    officialEmail: "sukantabisoyi@cgu-odisha.ac.in",
    phone: ["6370046155"],
    department: "Academics",
    designation: "Dean, Academics",
  },
  {
    name: "DR. SANJITA LENKA",
    personalEmail: "",
    officialEmail: "sanjitalenka@cgu-odisha.ac.in",
    phone: ["9937632420"],
    department: "Alumni Affairs",
    designation: "Dean, Alumni Affairs",
  },
  {
    name: "DR. DILLIP KUMAR DASH",
    personalEmail: "",
    officialEmail: "deanagriculture@cgu-odisha.ac.in",
    phone: ["9437463602"],
    department: "Agriculture",
    designation: "Dean, Agriculture",
  },
  {
    name: "DR. AMIYA KUMAR PRUSTY",
    personalEmail: "",
    officialEmail: "deanpharmacy@cgu-odisha.ac.in",
    phone: ["9437276618"],
    department: "Pharmacy",
    designation: "Dean, Pharmacy",
  },
  {
    name: "DR. SUJATA MOHANTY",
    personalEmail: "",
    officialEmail: "msujata@cgu-odisha.ac.in",
    phone: ["9437305379"],
    department: "Forensic Sciences",
    designation: "Dean, Forensic Sciences",
  },
  {
    name: "DR. MANOJ KUMAR DASH",
    personalEmail: "",
    officialEmail: "deanfth@cgu-odisha.ac.in",
    phone: ["8319589027"],
    department: "FTH",
    designation: "Dean, FTH",
  },
  {
    name: "DR. RANJITA MOHANTY",
    personalEmail: "",
    officialEmail: "deanresearch@cgu-odisha.ac.in",
    phone: ["9556779520"],
    department: "Research",
    designation: "Dean, Research",
  },
  {
    name: "DR. SASMITA MISHRA",
    personalEmail: "",
    officialEmail: "deaninternational@cgu-odisha.ac.in",
    phone: ["9861049181"],
    department: "International Affairs",
    designation: "Dean, International",
  },
  {
    name: "DR. RUDRA NARAYAN MOHAPATRA DSW ",
    personalEmail: "",
    officialEmail: "dsw@cgu-odisha.ac.in",
    phone: ["6371342540"],
    department: "DSW",
    designation: "Dean, Student Welfare",
  },
  {
    name: "CHITTARANJAN BISWAL",
    personalEmail: "",
    officialEmail: "deanmarine@cgu-odisha.ac.in",
    phone: ["8594892045"],
    department: "Marine Engineering",
    designation: "Dean, Marine Engineering",
  },

  // Heads of Departments
  {
    name: "DR. MONALISA MISHRA",
    personalEmail: "monalisa.mishra85@gmail.com",
    officialEmail: "hod_cse@cgu-odisha.ac.in",
    phone: ["9439733033"],
    department: "Computer Science",
    designation: "Head of Department, CSE",
  },
  {
    name: "DR. RANJITA MOHANTY",
    personalEmail: "",
    officialEmail: "hod_chemical@cgu-odisha.ac.in",
    phone: ["9556779520"],
    department: "Chemical Engineering",
    designation: "Head of Department, Chemical",
  },
  {
    name: "DR. SANJEET KUMAR SUBUDHI",
    personalEmail: "",
    officialEmail: "hod_electrical@cgu-odisha.ac.in",
    phone: ["8895550321"],
    department: "Electrical Engineering",
    designation: "Head of Department, Electrical",
  },
  {
    name: "DR. TUSAR KANTI DASH",
    personalEmail: "",
    officialEmail: "hod_etc@cgu-odisha.ac.in",
    phone: ["9337256321"],
    department: "Electronics & Communication",
    designation: "Head of Department, ECE",
  },
  {
    name: "DR. PRAKASH CHANDRA SWAIN",
    personalEmail: "",
    officialEmail: "hod_civil@cgu-odisha.ac.in",
    phone: ["9437257968"],
    department: "Civil Engineering",
    designation: "Head of Department, Civil",
  },
  {
    name: "DR. TARAPRASAD MOHAPATRA",
    personalEmail: "",
    officialEmail: "hod_mech@cgu-odisha.ac.in",
    phone: ["7978531046"],
    department: "Mechanical Engineering",
    designation: "Head of Department, Mechanical",
  },
  {
    name: "DR. SANJITA LENKA",
    personalEmail: "",
    officialEmail: "hod_management@cgu-odisha.ac.in",
    phone: ["9937632420"],
    department: "Management",
    designation: "Head of Department, Management",
  },
  // HSS Department
  {
    name: "DR. PRAGYAN PARAMITA PATTANAIK",
    personalEmail: "pragyan.pattnaik@cgu-odisha.ac.in",
    officialEmail: "pragyan.pattnaik@cgu-odisha.ac.in",
    phone: ["7682899812"],
    department: "Humanities & Social Science",
    designation: "Professor & HOD",
  },
  {
    name: "DR. ITISHREE PATTANAIK",
    personalEmail: "itishreepattnaik@cgu-odisha.ac.in",
    officialEmail: "itishreepattnaik@cgu-odisha.ac.in",
    phone: ["9438171778"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. GYANA RANJAN SAHOO",
    personalEmail: "gyanan.sahoo@cgu-odisha.ac.in",
    officialEmail: "gyanan.sahoo@cgu-odisha.ac.in",
    phone: ["9437484424"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. SASMITA JENA",
    personalEmail: "sasmitajena@cgu-odisha.ac.in",
    officialEmail: "sasmitajena@cgu-odisha.ac.in",
    phone: ["9437874147"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "MS. SWARNALATA PATRA",
    personalEmail: "swarnalata.patra@cgu-odisha.ac.in",
    officialEmail: "swarnalata.patra@cgu-odisha.ac.in",
    phone: ["9437348448"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "MR. ABHILASH ROUT",
    personalEmail: "abhilash.rout@cgu-odisha.ac.in",
    officialEmail: "abhilash.rout@cgu-odisha.ac.in",
    phone: ["7008829484"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. SAMIKSHYA SAMAL",
    personalEmail: "samikshya.samal@cgu-odisha.ac.in",
    officialEmail: "samikshya.samal@cgu-odisha.ac.in",
    phone: ["9438861442"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. GYANA RANJAN SAHOO",
    personalEmail: "gyanan.sahoo@cgu-odisha.ac.in",
    officialEmail: "gyanan.sahoo@cgu-odisha.ac.in",
    phone: ["9437484424"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. ARATI DEVI",
    personalEmail: "aratidevi@cgu-odisha.ac.in",
    officialEmail: "aratidevi@cgu-odisha.ac.in",
    phone: ["9438372424"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. SUBHADRA ROUT",
    personalEmail: "subhadrarout@cgu-odisha.ac.in",
    officialEmail: "subhadrarout@cgu-odisha.ac.in",
    phone: ["9437437084"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. SUSHREE SANGITA MOHANTY",
    personalEmail: "sushreesangita@cgu-odisha.ac.in",
    officialEmail: "sushreesangita@cgu-odisha.ac.in",
    phone: ["9437162279"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. MANAS RANJAN PUJARI",
    personalEmail: "manasranjanpujari@cgu-odisha.ac.in",
    officialEmail: "manasranjanpujari@cgu-odisha.ac.in",
    phone: ["9437884808"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. SMRUTI PRAVA MISHRA",
    personalEmail: "smrutiprava.mishra@cgu-odisha.ac.in",
    officialEmail: "smrutiprava.mishra@cgu-odisha.ac.in",
    phone: ["9437282303"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. PRATYUSH PRANJAL",
    personalEmail: "pratyushpranjal@cgu-odisha.ac.in",
    officialEmail: "pratyushpranjal@cgu-odisha.ac.in",
    phone: ["7008872779"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. ANINDITA BEHURA",
    personalEmail: "anindita.behura@cgu-odisha.ac.in",
    officialEmail: "anindita.behura@cgu-odisha.ac.in",
    phone: ["9437844184"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. DEBABRATA PANDA",
    personalEmail: "debabrata.panda@cgu-odisha.ac.in",
    officialEmail: "debabrata.panda@cgu-odisha.ac.in",
    phone: ["9437184484"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. SAMBIT MISHRA",
    personalEmail: "sambit.mishra@cgu-odisha.ac.in",
    officialEmail: "sambit.mishra@cgu-odisha.ac.in",
    phone: ["9437477484"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. ARATI DEVI",
    personalEmail: "aratidevi@cgu-odisha.ac.in",
    officialEmail: "aratidevi@cgu-odisha.ac.in",
    phone: ["9438372424"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. GYANA RANJAN SAHOO",
    personalEmail: "gyanan.sahoo@cgu-odisha.ac.in",
    officialEmail: "gyanan.sahoo@cgu-odisha.ac.in",
    phone: ["9437484424"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
 
  {
    name: "MS. SWARNALATA PATRA",
    personalEmail: "swarnalata.patra@cgu-odisha.ac.in",
    officialEmail: "swarnalata.patra@cgu-odisha.ac.in",
    phone: ["9437348448"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "MR. ABHILASH ROUT",
    personalEmail: "abhilash.rout@cgu-odisha.ac.in",
    officialEmail: "abhilash.rout@cgu-odisha.ac.in",
    phone: ["7008829484"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. SAMIKSHYA SAMAL",
    personalEmail: "samikshya.samal@cgu-odisha.ac.in",
    officialEmail: "samikshya.samal@cgu-odisha.ac.in",
    phone: ["9438861442"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. SUBHADRA ROUT",
    personalEmail: "subhadrarout@cgu-odisha.ac.in",
    officialEmail: "subhadrarout@cgu-odisha.ac.in",
    phone: ["9437437084"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. SUSHREE SANGITA MOHANTY",
    personalEmail: "sushreesangita@cgu-odisha.ac.in",
    officialEmail: "sushreesangita@cgu-odisha.ac.in",
    phone: ["9437162279"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. MANAS RANJAN PUJARI",
    personalEmail: "manasranjanpujari@cgu-odisha.ac.in",
    officialEmail: "manasranjanpujari@cgu-odisha.ac.in",
    phone: ["9437884808"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. SMRUTI PRAVA MISHRA",
    personalEmail: "smrutiprava.mishra@cgu-odisha.ac.in",
    officialEmail: "smrutiprava.mishra@cgu-odisha.ac.in",
    phone: ["9437282303"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. PRATYUSH PRANJAL",
    personalEmail: "pratyushpranjal@cgu-odisha.ac.in",
    officialEmail: "pratyushpranjal@cgu-odisha.ac.in",
    phone: ["7008872779"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. ANINDITA BEHURA",
    personalEmail: "anindita.behura@cgu-odisha.ac.in",
    officialEmail: "anindita.behura@cgu-odisha.ac.in",
    phone: ["9437844184"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. DEBABRATA PANDA",
    personalEmail: "debabrata.panda@cgu-odisha.ac.in",
    officialEmail: "debabrata.panda@cgu-odisha.ac.in",
    phone: ["9437184484"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  {
    name: "DR. SAMBIT MISHRA",
    personalEmail: "sambit.mishra@cgu-odisha.ac.in",
    officialEmail: "sambit.mishra@cgu-odisha.ac.in",
    phone: ["9437477484"],
    department: "Humanities & Social Science",
    designation: "Assistant Professor",
  },
  // Agricultural Department
  {
    name: "Dr. DILLIP KUMAR DASH",
    personalEmail: "dillip.dash@cgu-odisha.ac.in",
    officialEmail: "deanagriculture@cgu-odisha.ac.in",
    phone: ["9437463602"],
    department: "Agriculture",
    designation: "Dean",
  },
  {
    name: "Dr. SASMITA BEHURA",
    personalEmail: "sasmita.behura@cgu-odisha.ac.in",
    officialEmail: "sasmita.behura@cgu-odisha.ac.in",
    phone: ["9437541889"],
    department: "Agriculture",
    designation: "Assistant Professor",
  },
  {
    name: "Mr. SOUMYA RANJAN BEHERA",
    personalEmail: "soumyaranjan.behera@cgu-odisha.ac.in",
    officialEmail: "soumyaranjan.behera@cgu-odisha.ac.in",
    phone: ["7008853074"],
    department: "Agriculture",
    designation: "Assistant Professor",
  },
  {
    name: "Ms. PRIYANKA PRIYADARSHINI",
    personalEmail: "priyankapriyadarsini@cgu-odisha.ac.in",
    officialEmail: "priyankapriyadarsini@cgu-odisha.ac.in",
    phone: ["7008347194"],
    department: "Agriculture",
    designation: "Assistant Professor",
  },
  {
    name: "Mr. PRATAP KUMAR JENA",
    personalEmail: "pratap.jena@cgu-odisha.ac.in",
    officialEmail: "pratap.jena@cgu-odisha.ac.in",
    phone: ["9438039197"],
    department: "Agriculture",
    designation: "Assistant Professor",
  },
  {
    name: "Ms. ANKITA SWAIN",
    personalEmail: "ankita.swain@cgu-odisha.ac.in",
    officialEmail: "ankita.swain@cgu-odisha.ac.in",
    phone: ["7978918488"],
    department: "Agriculture",
    designation: "Assistant Professor",
  },
  {
    name: "Mr. ABHINASH DASH",
    personalEmail: "abhinash.dash@cgu-odisha.ac.in",
    officialEmail: "abhinash.dash@cgu-odisha.ac.in",
    phone: ["7008347194"],
    department: "Agriculture",
    designation: "Assistant Professor",
  },
  // Biotechnology Department
  {
    name: "Dr. ABHILIPSA SAMANTARAY",
    personalEmail: "abhilipsa.samantaray@cgu-odisha.ac.in",
    officialEmail: "abhilipsa.samantaray@cgu-odisha.ac.in",
    phone: ["9438011277"],
    department: "Biotechnology",
    designation: "Assistant Professor & HOD",
  },
  {
    name: "Dr. PRATIKSHYA MISHRA",
    personalEmail: "pratikshya.mishra@cgu-odisha.ac.in",
    officialEmail: "pratikshya.mishra@cgu-odisha.ac.in",
    phone: ["9437424424"],
    department: "Biotechnology",
    designation: "Assistant Professor",
  },
  {
    name: "Ms. ANANYA ACHARYA",
    personalEmail: "ananya.acharya@cgu-odisha.ac.in",
    officialEmail: "ananya.acharya@cgu-odisha.ac.in",
    phone: ["7008853074"],
    department: "Biotechnology",
    designation: "Assistant Professor",
  },
  // Botany Department
  {
    name: "Dr. SUBHRANSU SEKHAR PANDA",
    personalEmail: "subhransusekhar.panda@cgu-odisha.ac.in",
    officialEmail: "subhransusekhar.panda@cgu-odisha.ac.in",
    phone: ["9437177477"],
    department: "Botany",
    designation: "Assistant Professor & HOD",
  },
  {
    name: "Dr. SUSHREE SANGITA NAYAK",
    personalEmail: "sushreesangita.nayak@cgu-odisha.ac.in",
    officialEmail: "sushreesangita.nayak@cgu-odisha.ac.in",
    phone: ["9437884808"],
    department: "Botany",
    designation: "Assistant Professor",
  },
  {
    name: "Ms. ROSY RANI PANDA",
    personalEmail: "rosyrani.panda@cgu-odisha.ac.in",
    officialEmail: "rosyrani.panda@cgu-odisha.ac.in",
    phone: ["7008853074"],
    department: "Botany",
    designation: "Assistant Professor",
  },
  // Pharmacy Department
  {
    name: "Dr. AMIYA KUMAR PRUSTY",
    personalEmail: "amiya.prusty@cgu-odisha.ac.in",
    officialEmail: "deanpharmacy@cgu-odisha.ac.in",
    phone: ["9437276618"],
    department: "Pharmacy",
    designation: "Dean",
  },
  {
    name: "Dr. RAJASHREE MISHRA",
    personalEmail: "rajashree.mishra@cgu-odisha.ac.in",
    officialEmail: "rajashree.mishra@cgu-odisha.ac.in",
    phone: ["9437162279"],
    department: "Pharmacy",
    designation: "Assistant Professor & HOD",
  },
  {
    name: "Dr. PRATIKSHYA RAY",
    personalEmail: "pratikshya.ray@cgu-odisha.ac.in",
    officialEmail: "pratikshya.ray@cgu-odisha.ac.in",
    phone: ["9437424424"],
    department: "Pharmacy",
    designation: "Assistant Professor",
  },
  {
    name: "Mr. ARUP KUMAR RATH",
    personalEmail: "arupkumar.rath@cgu-odisha.ac.in",
    officialEmail: "arupkumar.rath@cgu-odisha.ac.in",
    phone: ["7008853074"],
    department: "Pharmacy",
    designation: "Assistant Professor",
  },
  {
    name: "Ms. SWETA SINGH",
    personalEmail: "sweta.singh@cgu-odisha.ac.in",
    officialEmail: "sweta.singh@cgu-odisha.ac.in",
    phone: ["7008853074"],
    department: "Pharmacy",
    designation: "Assistant Professor",
  },
  {
    name: "Ms. BARSHA PRIYADARSHINI",
    personalEmail: "barshapriyadarshini@cgu-odisha.ac.in",
    officialEmail: "barshapriyadarshini@cgu-odisha.ac.in",
    phone: ["7008853074"],
    department: "Pharmacy",
    designation: "Assistant Professor",
  },
  {
    name: "Ms. ANKITA SAHOO",
    personalEmail: "ankita.sahoo@cgu-odisha.ac.in",
    officialEmail: "ankita.sahoo@cgu-odisha.ac.in",
    phone: ["7008853074"],
    department: "Pharmacy",
    designation: "Assistant Professor",
  },
  {
    name: "Mr. DEEPAK KUMAR SAHOO",
    personalEmail: "deepakkumar.sahoo@cgu-odisha.ac.in",
    officialEmail: "deepakkumar.sahoo@cgu-odisha.ac.in",
    phone: ["7008853074"],
    department: "Pharmacy",
    designation: "Assistant Professor",
  },
{
  name: "Accounts Department",
  designation: "-",
  personalEmail: "-",
  officialEmail: "accounts@cgu-odisha.ac.in",
  phone: ["+91 9040272733", "+91 8456977122", "+91 8069072222"],
  department: "Accounts"
},
{
  name: "Dr Smita Parija",
  personalEmail: "",
  officialEmail: "",
  phone: ["+91 9438913032"],
  department: "ECE",
  designation: "Associate Professor",
},

{
  name: "Dr. Mayaluri Zefree Lazarus",
  personalEmail: "zefree.lazarus@gmail.com",
  officialEmail: "zefree.lazarus@cgu-odisha.ac.in",
  phone: ["6372599100"],
  department: "Electrical Engineering",
  designation: "Associate  Professor",
},
{
  name: "Debasis Behera",
  personalEmail: "debasis041@gmail.com",
  officialEmail: "debasis041@cgu-odisha.ac.in",
  phone: ["9178789515"],
  department: "Electrical Engineering",
  designation: "Assistant Professor",
},
{
  name: "Ashutosh Patnaik",
  personalEmail: "chintu.asutosh@gmail.com",
  officialEmail: "apatnaik@cgu-odisha.ac.in",
  phone: ["9937185034"],
  department: "Electrical Engineering",
  designation: "Assistant Professor",
},
{
  name: "Dr. Aditi Chatterjee",
  personalEmail: "aditichatterjee.ee@gmail.com",
  officialEmail: "aditichatterjee@cgu-odisha.ac.in",
  phone: ["9668575217"],
  department: "Electrical Engineering",
  designation: "Assistant Professor",
},
{
  name: "Mr. Achirangshu Patra",
  personalEmail: "",
  officialEmail: "achirangshu.patra@cgu-odisha.ac.in",
  phone: ["9734428543"],
  department: "Electrical Engineering",
  designation: "Assistant Professor",
},
{
  name: "Mr. Rakesh Kumar Sahoo",
  personalEmail: "sahoorakeshkumar66@gmail.com",
  officialEmail: "",
  phone: ["7008644502"],
  department: "Electrical Engineering",
  designation: "Assistant Professor",
},
{
  name: "Dr. Kartik Chandra Patra",
  personalEmail: "kacpatra47@gmail.com",
  officialEmail: "kartik.chandra.patra@cgu-odisha.ac.in",
  phone: ["9437087770", "8337900330"],
  department: "Electrical Engineering",
  designation: "Professor ",
},


  {
    name: "Jagannath Dayal Pradhan",
    personalEmail: "jagannath2464@gmail.com",
    officialEmail: "jdpradhan@cgu-odisha.ac.in",
    phone: ["7978707455"],
    department: "Electrical Engineering",
    designation: "Assistant Professor",
  },
  {
    name: "Dr. Priyadarshi Kanungo",
    personalEmail: "pkanungo@gmail.com",
    officialEmail: "deanengineering@cgu-odisha.ac.in",
    phone: ["7978531053"],
    department: "Electrical Engineering",
    designation: "Professor & Dean Engineering",
  },
  {
    name: "Seli Mohapatra",
    personalEmail: "selimohapatra@gmail.com",
    officialEmail: "selimohapatra@cgu-odisha.ac.in",
    phone: ["7978539911", "7381090990"],
    department: "Electrical Engineering",
    designation: "Assistant Professor",
  },
  {
    name: "Soumya Mishra",
    personalEmail: "soumyamishracvrce@gmail.com",
    officialEmail: "soumya@cgu-odisha.ac.in",
    phone: ["9337953858", "7381931100"],
    department: "Electrical Engineering",
    designation: "Assistant Professor",
  },
  {
    name: "Tapaswini Pattnaik",
    personalEmail: "tapaswini.n@gmail.com",
    officialEmail: "tapaswini@cgu-odisha.ac.in",
    phone: ["9937993267", "8144526776"],
    department: "Electrical Engineering",
    designation: "Assistant Professor",
  },
  {
    name: "Anoop Kumar Pipersahaniyan",
    personalEmail: "anoopgupta1786@gmail.com",
    officialEmail: "akpiper@cgu-odisha.ac.in",
    phone: ["8917215043"],
    department: "Electrical Engineering",
    designation: "Assistant Professor",
  },
 {
    name: "Dr. Kaushik Bhattacharyya",
    personalEmail: "drkaushikb1@gmail.com",
    officialEmail: "kaushik.b@cgu-odisha.ac.in",
    phone: ["9800714248", "8900095742"],
    department: "Electrical",
    designation: "Assistant Professor",
  },
  {
    name: "Dr. Debashis Panda",
    personalEmail: "phy.dpanda@gmail.com",
    officialEmail: "ece.dpanda@cgu-odisha.ac.in",
    phone: ["8093991477"],
    department: "Electrical",
    designation: "Associate Professor",
  },
//mba


  {
    name: "Dr. Sasmita Mishra",
    personalEmail: "sasmitamishra1981@gmail.com",
    officialEmail: "sasmitamishra@cgu-odisha.ac.in",
    phone: ["9861049181"],
    department: "MBA",
    designation: "Associate Professor",
  },
  {
    name: "Dr. Swaroop Mohanty",
    personalEmail: "swaruniv@gmail.com",
    officialEmail: "swaroop@cgu-odisha.ac.in",
    phone: ["9439331288"],
    department: "MBA",
    designation: "Assistant Professor",
  },
  {
    name: "Dr. Laxmidhar Panda",
    personalEmail: "pbapuni@gmail.com",
    officialEmail: "laxmidhar.panda@cgu-odisha.ac.in",
    phone: ["6350028826"],
    department: "MBA",
    designation: "Assistant Professor",
  },
  {
    name: "Dr. Abuzar Nomani",
    personalEmail: "abuzarnomani88@gmail.com",
    officialEmail: "abuzar.nomani@cgu-odisha.ac.in",
    phone: ["7417006481"],
    department: "MBA",
    designation: "Associate Professor",
  },
  //aic
   {
    name: "Ms. Sthita Prajna Moharana",
    personalEmail: "",
    officialEmail: "coo.aic@cgu-odisha.ac.in",
    phone: ["8249340282"],
    department: "AIC",
    designation: "COO",
  },
  {
    name: "Ms. Nirupama Tete",
    personalEmail: "",
    officialEmail: "nirupama.aic@cgu-odisha.ac.in",
    phone: ["8144619497"],
    department: "AIC",
    designation: "Management Trainee",
  },
   {
    name: "Mr. Abhijit Panigrahi",
    personalEmail: "",
    officialEmail: "abhijeet.aic@cgu-odisha.ac.in",
    phone: ["7747823583"],
    department: "AIC",
    designation: "Management Trainee",
  },
  {
  name: "DSW",
  personalEmail: "",
  officialEmail: "dsw@cgu-odisha.ac.in",
  phone: ["+91 9040097243"],
  department: "DSW",
  designation: ""
},
{
  name: "DSW office",
  personalEmail: "",
  officialEmail: "dsw@cgu-odisha.ac.in",
  phone: ["+91 8249282820"],
  department: "DSW",
  designation: ""
},

]

export default function CVRamanFacultySearch() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredFaculty = useMemo(() => {
    if (!searchTerm.trim()) return []
    const searchLower = searchTerm.toLowerCase()

    return facultyData.filter((faculty) => {
      const name = faculty.name.toLowerCase()
      const designation = faculty.designation.toLowerCase()
      const department = faculty.department.toLowerCase()

      // Handle multiple search terms (split by space)
      const searchTerms = searchLower.split(" ").filter((term) => term.length > 0)

      // Check if all search terms match in any field
      const matchesAllTerms = searchTerms.every(
        (term) => name.includes(term) || designation.includes(term) || department.includes(term),
      )

      // Also check for exact phrase match
      const exactMatch =
        name.includes(searchLower) || designation.includes(searchLower) || department.includes(searchLower)

      // Handle common abbreviations and variations
      const handleAbbreviations = (searchTerm: string) => {
        // HoD variations
        if (searchTerm.includes("hod")) {
          return designation.includes("head of department")
        }
        if (searchTerm.includes("dsw")) {
          return designation.includes("Dean, Student Welfare")
        }

        // Dean + department combinations
        if (searchTerm.includes("dean") && searchTerm.includes("engineering")) {
          return (
            designation.includes("dean") && (designation.includes("engineering") || department.includes("engineering"))
          )
        }

        if (searchTerm.includes("dean") && searchTerm.includes("management")) {
          return (
            designation.includes("dean") && (designation.includes("management") || department.includes("management"))
          )
        }

        if (searchTerm.includes("dean") && searchTerm.includes("research")) {
          return designation.includes("dean") && designation.includes("research")
        }

        if (searchTerm.includes("dean") && searchTerm.includes("international")) {
          return designation.includes("dean") && designation.includes("international")
        }

        if (searchTerm.includes("dean") && searchTerm.includes("student")) {
          return designation.includes("dean") && designation.includes("student")
        }

        if (searchTerm.includes("dean") && searchTerm.includes("alumni")) {
          return designation.includes("dean") && designation.includes("alumni")
        }

        if (searchTerm.includes("dean") && searchTerm.includes("agriculture")) {
          return designation.includes("dean") && designation.includes("agriculture")
        }

        if (searchTerm.includes("dean") && searchTerm.includes("pharmacy")) {
          return designation.includes("dean") && designation.includes("pharmacy")
        }

        if (searchTerm.includes("dean") && searchTerm.includes("forensic")) {
          return designation.includes("dean") && designation.includes("forensic")
        }

        if (searchTerm.includes("dean") && searchTerm.includes("marine")) {
          return designation.includes("dean") && designation.includes("marine")
        }

        if (searchTerm.includes("dean") && searchTerm.includes("academics")) {
          return designation.includes("dean") && designation.includes("academics")
        }

        // VC variations
        if (searchTerm.includes("vc") && !searchTerm.includes("pro")) {
          return designation.includes("vice chancellor") && !designation.includes("pro")
        }

        if (searchTerm.includes("pro vc") || searchTerm.includes("provc")) {
          return designation.includes("pro vice chancellor")
        }

        // Controller variations
        if (searchTerm.includes("coe") || searchTerm.includes("controller")) {
          return designation.includes("controller")
        }

        return false
      }

      return exactMatch || matchesAllTerms || handleAbbreviations(searchLower)
    })
  }, [searchTerm])

  const handleEmailClick = (email: string) => {
    window.open(`mailto:${email}`, "_blank")
  }

  const handlePhoneClick = (phone: string) => {
    window.open(`tel:${phone}`, "_blank")
  }

  const totalFaculty = facultyData.length
  const departments = [...new Set(facultyData.map((f) => f.department))].length
  const highOfficials = facultyData.filter(
    (f) =>
      f.designation.includes("Vice Chancellor") ||
      f.designation.includes("Dean") ||
      f.designation.includes("Registrar") ||
      f.designation.includes("Controller") ||
      f.designation.includes("Pro Vice Chancellor") ||
      f.designation.includes("Head of Department"),
  ).length

  const getDesignationColor = (designation: string) => {
    if (designation.includes("Pro Vice Chancellor")) return "bg-gradient-to-r from-purple-600 to-indigo-700"
    if (designation.includes("Vice Chancellor")) return "bg-gradient-to-r from-red-500 to-pink-600"
    if (designation.includes("Dean")) return "bg-gradient-to-r from-orange-500 to-red-600"
    if (designation.includes("Controller") || designation.includes("Head of Department"))
      return "bg-gradient-to-r from-yellow-500 to-orange-600"
    if (designation.includes("Professor") && !designation.includes("Assistant") && !designation.includes("Associate"))
      return "bg-gradient-to-r from-blue-500 to-indigo-600"
    if (designation.includes("Associate Professor")) return "bg-gradient-to-r from-green-500 to-blue-600"
    return "bg-gradient-to-r from-purple-500 to-violet-600"
  }

  const getDesignationIcon = (designation: string) => {
    if (
      designation.includes("Pro Vice Chancellor") ||
      designation.includes("Vice Chancellor") ||
      designation.includes("Dean") ||
      designation.includes("Controller") ||
      designation.includes("Head of Department")
    ) {
      return <Crown className="h-3 w-3 mr-1" />
    }
    return <User className="h-3 w-3 mr-1" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-200 to-violet-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200 to-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-200 to-rose-300 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Header */}
      <div className="relative bg-white/80 backdrop-blur-lg shadow-xl border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-violet-700 rounded-2xl shadow-lg">
                  <GraduationCap className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full"></div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                  CGU Faculty Search
                </h1>
                <p className="text-xl text-gray-700 mt-1 font-medium">CGU Faculty Search</p>
              

              </div>
            </div>

            {/* Stats Cards */}
            <div className="flex gap-4 flex-wrap">
              <Button
                onClick={() =>
                  window.open(
                    "https://docs.google.com/forms/d/e/1FAIpQLSfF1IOZred3hxEvOLZo0MTjY0Lt5F_drP8RZiXCA64eYh0OUg/viewform",
                    "_blank",
                  )
                }
                className="bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-4 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <div className="text-left">
                    <p className="text-sm font-bold">Missing Faculty?</p>
                    <p className="text-xs opacity-90">Request Addition</p>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Section */}
        <div className="mb-12">
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-purple-400" />
            </div>
            <Input
              type="text"
              placeholder="Search by name, designation, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-14 pr-6 py-6 text-lg border-2 border-purple-200 focus:border-purple-500 focus:ring-purple-500 rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm placeholder:text-gray-400 transition-all duration-300 hover:shadow-xl"
            />
            <div className="absolute inset-y-0 right-0 pr-6 flex items-center">
              <div className="bg-gradient-to-r from-purple-500 to-violet-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
                {searchTerm ? `${filteredFaculty.length} found` : "Start typing..."}
              </div>
            </div>
          </div>

          {searchTerm && (
            <div className="text-center mt-6">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-purple-100">
                <Search className="h-4 w-4 text-purple-500" />
                <p className="text-gray-700 font-medium">
                  {filteredFaculty.length === 0
                    ? "No faculty members found matching your search"
                    : `Found ${filteredFaculty.length} faculty member${filteredFaculty.length !== 1 ? "s" : ""} matching "${searchTerm}"`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {searchTerm && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredFaculty.map((faculty, index) => (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:bg-white/90 hover:scale-105 rounded-3xl overflow-hidden"
              >
                <CardHeader className="pb-4 bg-gradient-to-br from-purple-50 to-violet-50 relative">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-200 to-violet-300 rounded-full -mr-10 -mt-10 opacity-20"></div>
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl leading-tight text-gray-800 group-hover:text-purple-700 transition-colors duration-300">
                        {faculty.name}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge className={`${getDesignationColor(faculty.designation)} text-white border-0 shadow-md`}>
                          {getDesignationIcon(faculty.designation)}
                          {faculty.designation}
                        </Badge>
                        <Badge variant="outline" className="bg-white/80 border-purple-200 text-purple-700">
                          <Building className="h-3 w-3 mr-1" />
                          {faculty.department}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 p-6">
                  {/* Phone Numbers */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <div className="p-1 bg-green-100 rounded-lg">
                        <Phone className="h-4 w-4 text-green-600" />
                      </div>
                      Phone Numbers
                    </div>
                    <div className="space-y-2">
                      {faculty.phone.map((phone, phoneIndex) => (
                        <Button
                          key={phoneIndex}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left h-auto py-3 px-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:from-green-100 hover:to-emerald-100 hover:border-green-300 transition-all duration-300 rounded-xl group/phone"
                          onClick={() => handlePhoneClick(phone)}
                        >
                          <Phone className="h-4 w-4 mr-3 flex-shrink-0 text-green-600 group-hover/phone:scale-110 transition-transform duration-200" />
                          <span className="font-mono text-sm font-medium text-gray-700">{phone}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Email Addresses */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <div className="p-1 bg-blue-100 rounded-lg">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </div>
                      Email Addresses
                    </div>
                    <div className="space-y-3">
                      {faculty.officialEmail && (
                        <div>
                          <p className="text-xs text-gray-500 mb-2 font-medium flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Official Email
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-left h-auto py-3 px-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-300 rounded-xl group/email"
                            onClick={() => handleEmailClick(faculty.officialEmail)}
                          >
                            <Mail className="h-4 w-4 mr-3 flex-shrink-0 text-blue-600 group-hover/email:scale-110 transition-transform duration-200" />
                            <span className="text-sm break-all text-gray-700 font-medium">{faculty.officialEmail}</span>
                          </Button>
                        </div>
                      )}

                      {faculty.personalEmail && (
                        <div>
                          <p className="text-xs text-gray-500 mb-2 font-medium flex items-center gap-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            Personal Email
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-left h-auto py-3 px-4 bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200 hover:from-purple-100 hover:to-violet-100 hover:border-purple-300 transition-all duration-300 rounded-xl group/email"
                            onClick={() => handleEmailClick(faculty.personalEmail)}
                          >
                            <Mail className="h-4 w-4 mr-3 flex-shrink-0 text-purple-600 group-hover/email:scale-110 transition-transform duration-200" />
                            <span className="text-sm break-all text-gray-700 font-medium">{faculty.personalEmail}</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Welcome Message */}
        {!searchTerm && (
          <div className="text-center py-20">
            <div className="max-w-2xl mx-auto">
              <div className="relative mb-8">
                <div className="p-6 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full w-28 h-28 mx-auto shadow-2xl">
                  <Search className="h-16 w-16 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full animate-bounce"></div>
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent mb-6">
                Discover Our Faculty
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Search through our distinguished faculty members by name, designation, or department. Connect with them
                instantly and find their expertise areas.
              </p>

              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-purple-100 max-w-lg mx-auto">
                <div className="flex items-center gap-2 mb-4">
                  <p className="font-semibold text-gray-800">Search Tips</p>
                </div>
                <ul className="text-left space-y-3 text-gray-600">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    Search by faculty name (e.g., "Dr. Sampa")
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    Search by designation (e.g., "Professor", "Dean")
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    Search by department (e.g., "Computer Science", "MBA")
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                    Browse through our comprehensive faculty directory across {departments} departments
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative bg-gradient-to-r from-purple-900 to-violet-900 text-white mt-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-xl">
                <GraduationCap className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold">CGU Faculty Search</h3>
            </div>
            <p className="text-purple-200 mb-2">Faculty Directory Portal</p>
            <p className="text-sm text-purple-300">© 2024 CGU Faculty Search. All rights reserved.</p>
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-purple-300">
              <MapPin className="h-4 w-4" />
              <span>Bhubaneswar, Odisha, India</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
