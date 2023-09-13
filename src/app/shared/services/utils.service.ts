import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }

  capitalizeFirstLetter(str: string) {
      return str.charAt(0).toUpperCase() + str.slice(1);
  }

  dateFromCalendarToTimestamp(date: string): number {
    let [año, mes, día] = date.split('-').map(Number);
    let timestamp = Date.UTC(año, mes - 1, día); 
    return timestamp
  }

  generateSixDigitRandomNumber = () => {
    return Math.floor(100000 + Math.random() * 900000);
  };

  timestampToDateNumbers(timestamp: number): object {
    const date: Date = new Date(timestamp); 
    const minutes: number = date.getUTCMinutes()
    const hours: number = date.getUTCHours();
    const day: number = date.getUTCDate();
    const month: number = date.getUTCMonth() + 1;
    const year: number = date.getUTCFullYear();
    return {minutes, hours, day, month, year}
  }

  countries = [
    {
      name: 'Afghanistan',
      code: '+93',
      isoCode: 'AF',
    },
    {
      name: 'Aland Islands',
      code: '+358',
      isoCode: 'AX',
    },
    {
      name: 'Albania',
      code: '+355',
      isoCode: 'AL',
    },
    {
      name: 'Algeria',
      code: '+213',
      isoCode: 'DZ',
    },
    {
      name: 'AmericanSamoa',
      code: '+1684',
      isoCode: 'AS',
    },
    {
      name: 'Andorra',
      code: '+376',
      isoCode: 'AD',
    },
    {
      name: 'Angola',
      code: '+244',
      isoCode: 'AO',
    },
    {
      name: 'Anguilla',
      code: '+1264',
      isoCode: 'AI',
    },
    {
      name: 'Antarctica',
      code: '+672',
      isoCode: 'AQ',
    },
    {
      name: 'Antigua and Barbuda',
      code: '+1268',
      isoCode: 'AG',
    },
    {
      name: 'Argentina',
      code: '+54',
      isoCode: 'AR',
    },
    {
      name: 'Armenia',
      code: '+374',
      isoCode: 'AM',
    },
    {
      name: 'Aruba',
      code: '+297',
      isoCode: 'AW',
    },
    {
      name: 'Australia',
      code: '+61',
      isoCode: 'AU',
    },
    {
      name: 'Austria',
      code: '+43',
      isoCode: 'AT',
    },
    {
      name: 'Azerbaijan',
      code: '+994',
      isoCode: 'AZ',
    },
    {
      name: 'Bahamas',
      code: '+1242',
      isoCode: 'BS',
    },
    {
      name: 'Bahrain',
      code: '+973',
      isoCode: 'BH',
    },
    {
      name: 'Bangladesh',
      code: '+880',
      isoCode: 'BD',
    },
    {
      name: 'Barbados',
      code: '+1246',
      isoCode: 'BB',
    },
    {
      name: 'Belarus',
      code: '+375',
      isoCode: 'BY',
    },
    {
      name: 'Belgium',
      code: '+32',
      isoCode: 'BE',
    },
    {
      name: 'Belize',
      code: '+501',
      isoCode: 'BZ',
    },
    {
      name: 'Benin',
      code: '+229',
      isoCode: 'BJ',
    },
    {
      name: 'Bermuda',
      code: '+1441',
      isoCode: 'BM',
    },
    {
      name: 'Bhutan',
      code: '+975',
      isoCode: 'BT',
    },
    {
      name: 'Bolivia, Plurinational State of',
      code: '+591',
      isoCode: 'BO',
    },
    {
      name: 'Bosnia and Herzegovina',
      code: '+387',
      isoCode: 'BA',
    },
    {
      name: 'Botswana',
      code: '+267',
      isoCode: 'BW',
    },
    {
      name: 'Brazil',
      code: '+55',
      isoCode: 'BR',
    },
    {
      name: 'British Indian Ocean Territory',
      code: '+246',
      isoCode: 'IO',
    },
    {
      name: 'Brunei Darussalam',
      code: '+673',
      isoCode: 'BN',
    },
    {
      name: 'Bulgaria',
      code: '+359',
      isoCode: 'BG',
    },
    {
      name: 'Burkina Faso',
      code: '+226',
      isoCode: 'BF',
    },
    {
      name: 'Burundi',
      code: '+257',
      isoCode: 'BI',
    },
    {
      name: 'Cambodia',
      code: '+855',
      isoCode: 'KH',
    },
    {
      name: 'Cameroon',
      code: '+237',
      isoCode: 'CM',
    },
    {
      name: 'Canada',
      code: '+1',
      isoCode: 'CA',
    },
    {
      name: 'Cape Verde',
      code: '+238',
      isoCode: 'CV',
    },
    {
      name: 'Cayman Islands',
      code: '+ 345',
      isoCode: 'KY',
    },
    {
      name: 'Central African Republic',
      code: '+236',
      isoCode: 'CF',
    },
    {
      name: 'Chad',
      code: '+235',
      isoCode: 'TD',
    },
    {
      name: 'Chile',
      code: '+56',
      isoCode: 'CL',
    },
    {
      name: 'China',
      code: '+86',
      isoCode: 'CN',
    },
    {
      name: 'Christmas Island',
      code: '+61',
      isoCode: 'CX',
    },
    {
      name: 'Cocos (Keeling) Islands',
      code: '+61',
      isoCode: 'CC',
    },
    {
      name: 'Colombia',
      code: '+57',
      isoCode: 'CO',
    },
    {
      name: 'Comoros',
      code: '+269',
      isoCode: 'KM',
    },
    {
      name: 'Congo',
      code: '+242',
      isoCode: 'CG',
    },
    {
      name: 'Congo, The Democratic Republic of the Congo',
      code: '+243',
      isoCode: 'CD',
    },
    {
      name: 'Cook Islands',
      code: '+682',
      isoCode: 'CK',
    },
    {
      name: 'Costa Rica',
      code: '+506',
      isoCode: 'CR',
    },
    {
      name: "Cote d'Ivoire",
      code: '+225',
      isoCode: 'CI',
    },
    {
      name: 'Croatia',
      code: '+385',
      isoCode: 'HR',
    },
    {
      name: 'Cuba',
      code: '+53',
      isoCode: 'CU',
    },
    {
      name: 'Cyprus',
      code: '+357',
      isoCode: 'CY',
    },
    {
      name: 'Czech Republic',
      code: '+420',
      isoCode: 'CZ',
    },
    {
      name: 'Denmark',
      code: '+45',
      isoCode: 'DK',
    },
    {
      name: 'Djibouti',
      code: '+253',
      isoCode: 'DJ',
    },
    {
      name: 'Dominica',
      code: '+1767',
      isoCode: 'DM',
    },
    {
      name: 'Dominican Republic',
      code: '+1849',
      isoCode: 'DO',
    },
    {
      name: 'Ecuador',
      code: '+593',
      isoCode: 'EC',
    },
    {
      name: 'Egypt',
      code: '+20',
      isoCode: 'EG',
    },
    {
      name: 'El Salvador',
      code: '+503',
      isoCode: 'SV',
    },
    {
      name: 'Equatorial Guinea',
      code: '+240',
      isoCode: 'GQ',
    },
    {
      name: 'Eritrea',
      code: '+291',
      isoCode: 'ER',
    },
    {
      name: 'Estonia',
      code: '+372',
      isoCode: 'EE',
    },
    {
      name: 'Ethiopia',
      code: '+251',
      isoCode: 'ET',
    },
    {
      name: 'Falkland Islands (Malvinas)',
      code: '+500',
      isoCode: 'FK',
    },
    {
      name: 'Faroe Islands',
      code: '+298',
      isoCode: 'FO',
    },
    {
      name: 'Fiji',
      code: '+679',
      isoCode: 'FJ',
    },
    {
      name: 'Finland',
      code: '+358',
      isoCode: 'FI',
    },
    {
      name: 'France',
      code: '+33',
      isoCode: 'FR',
    },
    {
      name: 'French Guiana',
      code: '+594',
      isoCode: 'GF',
    },
    {
      name: 'French Polynesia',
      code: '+689',
      isoCode: 'PF',
    },
    {
      name: 'Gabon',
      code: '+241',
      isoCode: 'GA',
    },
    {
      name: 'Gambia',
      code: '+220',
      isoCode: 'GM',
    },
    {
      name: 'Georgia',
      code: '+995',
      isoCode: 'GE',
    },
    {
      name: 'Germany',
      code: '+49',
      isoCode: 'DE',
    },
    {
      name: 'Ghana',
      code: '+233',
      isoCode: 'GH',
    },
    {
      name: 'Gibraltar',
      code: '+350',
      isoCode: 'GI',
    },
    {
      name: 'Greece',
      code: '+30',
      isoCode: 'GR',
    },
    {
      name: 'Greenland',
      code: '+299',
      isoCode: 'GL',
    },
    {
      name: 'Grenada',
      code: '+1473',
      isoCode: 'GD',
    },
    {
      name: 'Guadeloupe',
      code: '+590',
      isoCode: 'GP',
    },
    {
      name: 'Guam',
      code: '+1671',
      isoCode: 'GU',
    },
    {
      name: 'Guatemala',
      code: '+502',
      isoCode: 'GT',
    },
    {
      name: 'Guernsey',
      code: '+44',
      isoCode: 'GG',
    },
    {
      name: 'Guinea',
      code: '+224',
      isoCode: 'GN',
    },
    {
      name: 'Guinea-Bissau',
      code: '+245',
      isoCode: 'GW',
    },
    {
      name: 'Guyana',
      code: '+595',
      isoCode: 'GY',
    },
    {
      name: 'Haiti',
      code: '+509',
      isoCode: 'HT',
    },
    {
      name: 'Holy See (Vatican City State)',
      code: '+379',
      isoCode: 'VA',
    },
    {
      name: 'Honduras',
      code: '+504',
      isoCode: 'HN',
    },
    {
      name: 'Hong Kong',
      code: '+852',
      isoCode: 'HK',
    },
    {
      name: 'Hungary',
      code: '+36',
      isoCode: 'HU',
    },
    {
      name: 'Iceland',
      code: '+354',
      isoCode: 'IS',
    },
    {
      name: 'India',
      code: '+91',
      isoCode: 'IN',
    },
    {
      name: 'Indonesia',
      code: '+62',
      isoCode: 'ID',
    },
    {
      name: 'Iran, Islamic Republic of Persian Gulf',
      code: '+98',
      isoCode: 'IR',
    },
    {
      name: 'Iraq',
      code: '+964',
      isoCode: 'IQ',
    },
    {
      name: 'Ireland',
      code: '+353',
      isoCode: 'IE',
    },
    {
      name: 'Isle of Man',
      code: '+44',
      isoCode: 'IM',
    },
    {
      name: 'Israel',
      code: '+972',
      isoCode: 'IL',
    },
    {
      name: 'Italy',
      code: '+39',
      isoCode: 'IT',
    },
    {
      name: 'Jamaica',
      code: '+1876',
      isoCode: 'JM',
    },
    {
      name: 'Japan',
      code: '+81',
      isoCode: 'JP',
    },
    {
      name: 'Jersey',
      code: '+44',
      isoCode: 'JE',
    },
    {
      name: 'Jordan',
      code: '+962',
      isoCode: 'JO',
    },
    {
      name: 'Kazakhstan',
      code: '+77',
      isoCode: 'KZ',
    },
    {
      name: 'Kenya',
      code: '+254',
      isoCode: 'KE',
    },
    {
      name: 'Kiribati',
      code: '+686',
      isoCode: 'KI',
    },
    {
      name: "Korea, Democratic People's Republic of Korea",
      code: '+850',
      isoCode: 'KP',
    },
    {
      name: 'Korea, Republic of South Korea',
      code: '+82',
      isoCode: 'KR',
    },
    {
      name: 'Kuwait',
      code: '+965',
      isoCode: 'KW',
    },
    {
      name: 'Kyrgyzstan',
      code: '+996',
      isoCode: 'KG',
    },
    {
      name: 'Laos',
      code: '+856',
      isoCode: 'LA',
    },
    {
      name: 'Latvia',
      code: '+371',
      isoCode: 'LV',
    },
    {
      name: 'Lebanon',
      code: '+961',
      isoCode: 'LB',
    },
    {
      name: 'Lesotho',
      code: '+266',
      isoCode: 'LS',
    },
    {
      name: 'Liberia',
      code: '+231',
      isoCode: 'LR',
    },
    {
      name: 'Libyan Arab Jamahiriya',
      code: '+218',
      isoCode: 'LY',
    },
    {
      name: 'Liechtenstein',
      code: '+423',
      isoCode: 'LI',
    },
    {
      name: 'Lithuania',
      code: '+370',
      isoCode: 'LT',
    },
    {
      name: 'Luxembourg',
      code: '+352',
      isoCode: 'LU',
    },
    {
      name: 'Macao',
      code: '+853',
      isoCode: 'MO',
    },
    {
      name: 'Macedonia',
      code: '+389',
      isoCode: 'MK',
    },
    {
      name: 'Madagascar',
      code: '+261',
      isoCode: 'MG',
    },
    {
      name: 'Malawi',
      code: '+265',
      isoCode: 'MW',
    },
    {
      name: 'Malaysia',
      code: '+60',
      isoCode: 'MY',
    },
    {
      name: 'Maldives',
      code: '+960',
      isoCode: 'MV',
    },
    {
      name: 'Mali',
      code: '+223',
      isoCode: 'ML',
    },
    {
      name: 'Malta',
      code: '+356',
      isoCode: 'MT',
    },
    {
      name: 'Marshall Islands',
      code: '+692',
      isoCode: 'MH',
    },
    {
      name: 'Martinique',
      code: '+596',
      isoCode: 'MQ',
    },
    {
      name: 'Mauritania',
      code: '+222',
      isoCode: 'MR',
    },
    {
      name: 'Mauritius',
      code: '+230',
      isoCode: 'MU',
    },
    {
      name: 'Mayotte',
      code: '+262',
      isoCode: 'YT',
    },
    {
      name: 'Mexico',
      code: '+52',
      isoCode: 'MX',
    },
    {
      name: 'Micronesia, Federated States of Micronesia',
      code: '+691',
      isoCode: 'FM',
    },
    {
      name: 'Moldova',
      code: '+373',
      isoCode: 'MD',
    },
    {
      name: 'Monaco',
      code: '+377',
      isoCode: 'MC',
    },
    {
      name: 'Mongolia',
      code: '+976',
      isoCode: 'MN',
    },
    {
      name: 'Montenegro',
      code: '+382',
      isoCode: 'ME',
    },
    {
      name: 'Montserrat',
      code: '+1664',
      isoCode: 'MS',
    },
    {
      name: 'Morocco',
      code: '+212',
      isoCode: 'MA',
    },
    {
      name: 'Mozambique',
      code: '+258',
      isoCode: 'MZ',
    },
    {
      name: 'Myanmar',
      code: '+95',
      isoCode: 'MM',
    },
    {
      name: 'Namibia',
      code: '+264',
      isoCode: 'NA',
    },
    {
      name: 'Nauru',
      code: '+674',
      isoCode: 'NR',
    },
    {
      name: 'Nepal',
      code: '+977',
      isoCode: 'NP',
    },
    {
      name: 'Netherlands',
      code: '+31',
      isoCode: 'NL',
    },
    {
      name: 'Netherlands Antilles',
      code: '+599',
      isoCode: 'AN',
    },
    {
      name: 'New Caledonia',
      code: '+687',
      isoCode: 'NC',
    },
    {
      name: 'New Zealand',
      code: '+64',
      isoCode: 'NZ',
    },
    {
      name: 'Nicaragua',
      code: '+505',
      isoCode: 'NI',
    },
    {
      name: 'Niger',
      code: '+227',
      isoCode: 'NE',
    },
    {
      name: 'Nigeria',
      code: '+234',
      isoCode: 'NG',
    },
    {
      name: 'Niue',
      code: '+683',
      isoCode: 'NU',
    },
    {
      name: 'Norfolk Island',
      code: '+672',
      isoCode: 'NF',
    },
    {
      name: 'Northern Mariana Islands',
      code: '+1670',
      isoCode: 'MP',
    },
    {
      name: 'Norway',
      code: '+47',
      isoCode: 'NO',
    },
    {
      name: 'Oman',
      code: '+968',
      isoCode: 'OM',
    },
    {
      name: 'Pakistan',
      code: '+92',
      isoCode: 'PK',
    },
    {
      name: 'Palau',
      code: '+680',
      isoCode: 'PW',
    },
    {
      name: 'Palestinian Territory, Occupied',
      code: '+970',
      isoCode: 'PS',
    },
    {
      name: 'Panama',
      code: '+507',
      isoCode: 'PA',
    },
    {
      name: 'Papua New Guinea',
      code: '+675',
      isoCode: 'PG',
    },
    {
      name: 'Paraguay',
      code: '+595',
      isoCode: 'PY',
    },
    {
      name: 'Peru',
      code: '+51',
      isoCode: 'PE',
    },
    {
      name: 'Philippines',
      code: '+63',
      isoCode: 'PH',
    },
    {
      name: 'Pitcairn',
      code: '+872',
      isoCode: 'PN',
    },
    {
      name: 'Poland',
      code: '+48',
      isoCode: 'PL',
    },
    {
      name: 'Portugal',
      code: '+351',
      isoCode: 'PT',
    },
    {
      name: 'Puerto Rico',
      code: '+1939',
      isoCode: 'PR',
    },
    {
      name: 'Qatar',
      code: '+974',
      isoCode: 'QA',
    },
    {
      name: 'Romania',
      code: '+40',
      isoCode: 'RO',
    },
    {
      name: 'Russia',
      code: '+7',
      isoCode: 'RU',
    },
    {
      name: 'Rwanda',
      code: '+250',
      isoCode: 'RW',
    },
    {
      name: 'Reunion',
      code: '+262',
      isoCode: 'RE',
    },
    {
      name: 'Saint Barthelemy',
      code: '+590',
      isoCode: 'BL',
    },
    {
      name: 'Saint Helena, Ascension and Tristan Da Cunha',
      code: '+290',
      isoCode: 'SH',
    },
    {
      name: 'Saint Kitts and Nevis',
      code: '+1869',
      isoCode: 'KN',
    },
    {
      name: 'Saint Lucia',
      code: '+1758',
      isoCode: 'LC',
    },
    {
      name: 'Saint Martin',
      code: '+590',
      isoCode: 'MF',
    },
    {
      name: 'Saint Pierre and Miquelon',
      code: '+508',
      isoCode: 'PM',
    },
    {
      name: 'Saint Vincent and the Grenadines',
      code: '+1784',
      isoCode: 'VC',
    },
    {
      name: 'Samoa',
      code: '+685',
      isoCode: 'WS',
    },
    {
      name: 'San Marino',
      code: '+378',
      isoCode: 'SM',
    },
    {
      name: 'Sao Tome and Principe',
      code: '+239',
      isoCode: 'ST',
    },
    {
      name: 'Saudi Arabia',
      code: '+966',
      isoCode: 'SA',
    },
    {
      name: 'Senegal',
      code: '+221',
      isoCode: 'SN',
    },
    {
      name: 'Serbia',
      code: '+381',
      isoCode: 'RS',
    },
    {
      name: 'Seychelles',
      code: '+248',
      isoCode: 'SC',
    },
    {
      name: 'Sierra Leone',
      code: '+232',
      isoCode: 'SL',
    },
    {
      name: 'Singapore',
      code: '+65',
      isoCode: 'SG',
    },
    {
      name: 'Slovakia',
      code: '+421',
      isoCode: 'SK',
    },
    {
      name: 'Slovenia',
      code: '+386',
      isoCode: 'SI',
    },
    {
      name: 'Solomon Islands',
      code: '+677',
      isoCode: 'SB',
    },
    {
      name: 'Somalia',
      code: '+252',
      isoCode: 'SO',
    },
    {
      name: 'South Africa',
      code: '+27',
      isoCode: 'ZA',
    },
    {
      name: 'South Sudan',
      code: '+211',
      isoCode: 'SS',
    },
    {
      name: 'South Georgia and the South Sandwich Islands',
      code: '+500',
      isoCode: 'GS',
    },
    {
      name: 'Spain',
      code: '+34',
      isoCode: 'ES',
    },
    {
      name: 'Sri Lanka',
      code: '+94',
      isoCode: 'LK',
    },
    {
      name: 'Sudan',
      code: '+249',
      isoCode: 'SD',
    },
    {
      name: 'Suriname',
      code: '+597',
      isoCode: 'SR',
    },
    {
      name: 'Svalbard and Jan Mayen',
      code: '+47',
      isoCode: 'SJ',
    },
    {
      name: 'Swaziland',
      code: '+268',
      isoCode: 'SZ',
    },
    {
      name: 'Sweden',
      code: '+46',
      isoCode: 'SE',
    },
    {
      name: 'Switzerland',
      code: '+41',
      isoCode: 'CH',
    },
    {
      name: 'Syrian Arab Republic',
      code: '+963',
      isoCode: 'SY',
    },
    {
      name: 'Taiwan',
      code: '+886',
      isoCode: 'TW',
    },
    {
      name: 'Tajikistan',
      code: '+992',
      isoCode: 'TJ',
    },
    {
      name: 'Tanzania, United Republic of Tanzania',
      code: '+255',
      isoCode: 'TZ',
    },
    {
      name: 'Thailand',
      code: '+66',
      isoCode: 'TH',
    },
    {
      name: 'Timor-Leste',
      code: '+670',
      isoCode: 'TL',
    },
    {
      name: 'Togo',
      code: '+228',
      isoCode: 'TG',
    },
    {
      name: 'Tokelau',
      code: '+690',
      isoCode: 'TK',
    },
    {
      name: 'Tonga',
      code: '+676',
      isoCode: 'TO',
    },
    {
      name: 'Trinidad and Tobago',
      code: '+1868',
      isoCode: 'TT',
    },
    {
      name: 'Tunisia',
      code: '+216',
      isoCode: 'TN',
    },
    {
      name: 'Turkey',
      code: '+90',
      isoCode: 'TR',
    },
    {
      name: 'Turkmenistan',
      code: '+993',
      isoCode: 'TM',
    },
    {
      name: 'Turks and Caicos Islands',
      code: '+1649',
      isoCode: 'TC',
    },
    {
      name: 'Tuvalu',
      code: '+688',
      isoCode: 'TV',
    },
    {
      name: 'Uganda',
      code: '+256',
      isoCode: 'UG',
    },
    {
      name: 'Ukraine',
      code: '+380',
      isoCode: 'UA',
    },
    {
      name: 'United Arab Emirates',
      code: '+971',
      isoCode: 'AE',
    },
    {
      name: 'United Kingdom',
      code: '+44',
      isoCode: 'GB',
    },
    {
      name: 'United States',
      code: '+1',
      isoCode: 'US',
    },
    {
      name: 'Uruguay',
      code: '+598',
      isoCode: 'UY',
    },
    {
      name: 'Uzbekistan',
      code: '+998',
      isoCode: 'UZ',
    },
    {
      name: 'Vanuatu',
      code: '+678',
      isoCode: 'VU',
    },
    {
      name: 'Venezuela',
      code: '+58',
      isoCode: 'VE',
    },
    {
      name: 'Vietnam',
      code: '+84',
      isoCode: 'VN',
    },
    {
      name: 'Virgin Islands, British',
      code: '+1284',
      isoCode: 'VG',
    },
    {
      name: 'Virgin Islands, U.S.',
      code: '+1340',
      isoCode: 'VI',
    },
    {
      name: 'Wallis and Futuna',
      code: '+681',
      isoCode: 'WF',
    },
    {
      name: 'Yemen',
      code: '+967',
      isoCode: 'YE',
    },
    {
      name: 'Zambia',
      code: '+260',
      isoCode: 'ZM',
    },
    {
      name: 'Zimbabwe',
      code: '+263',
      isoCode: 'ZW',
    },
  ];

  departments = [
    {
      name: "Departamento de mantenimiento",
      id: "15645641895645121654"
    },
    {
      name: "Departamento de calidad",
      id: "16861285646541154"
    }
  ]

  profiles = [
    {
      name: "Técnico de mantenimiento",
      id: "15645641895645121654"
    },
    {
      name: "Auxiliar de calidad",
      id: "16861285646541154"
    }
  ]

  experienceOptions = [
    "Menos de 1 año",
    "1-2 años",
    "3-5 años",
    "6-10 años",
    "11-20 años",
    "Mas de 20 años",
  ]
}
