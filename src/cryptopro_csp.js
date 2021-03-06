// @flow
import {
  CERT_KEY_ENCIPHERMENT_KEY_USAGE,
  CERT_DATA_ENCIPHERMENT_KEY_USAGE,
  CERT_DIGITAL_SIGNATURE_KEY_USAGE,
  CERT_NON_REPUDIATION_KEY_USAGE,
  // XCN_CERT_NAME_STR_NONE,
  PROVIDER_NAME,
  CX509CertificateRequestPkcs10,
  CX509ExtensionEnhancedKeyUsage,
  CX509ExtensionKeyUsage,
  CX500DistinguishedName,
  CX509PrivateKey,
  CX509Enrollment,
  CObjectIds,
  CObjectId,
  CREATE_REQUEST
} from './constants';

import cryptoProPlugin from './cadesplugin_api';
import { decimalToHexString } from './utils';

type SignType = {
  recordID: string,
  sign: string
};

type SignTypeParams = {
  recordID: string,
  digest: string
};

type TypeStartsWith = {
  startsWith: Function
};

type TypeUniqueContainerName = {
  UniqueContainerName: TypeStartsWith
};

type TypePrivateKey = {
  PrivateKey: TypeUniqueContainerName
};

export const isPluginAsync = (): boolean =>
  !!window.cadesplugin.CreateObjectAsync;


/**
 *
 * @param cert
 */
export const isOnTokenAsync = (cert: TypePrivateKey): Promise<boolean> => (
  window.cadesplugin.async_spawn(function* (): Generator<*, *, *> { // eslint-disable-line func-names
    const privateKey = yield cert.PrivateKey;
    const uniqueContainerName = yield privateKey.UniqueContainerName;
    return !uniqueContainerName.startsWith('REGISTRY');
  })
);

/**
 *
 * @param cert
 */
export const isOnTokenSync = (cert: TypePrivateKey): boolean =>
  !cert.PrivateKey.UniqueContainerName.startsWith('REGISTRY');

/**
 *
 * @param certBase64
 * @returns {*}
 */
export const getCertSync = (certBase64: string): string => {
  let cert = null;
  try {
    cert = window.cadesplugin.CreateObject('CAdESCOM.Certificate');
    cert.Import(certBase64);
    cert.FindPrivateKey();
  } catch (ex) {
    console.info('Failed to create CAdESCOM.Certificate: ', ex.message); // eslint-disable-line no-console
    throw new Error('sign.private_key_not_found');
  }
  return cert;
};

/**
 *
 * @param certBase64
 */
export const getCertAsync = (certBase64: string): Promise<*> => (
  window.cadesplugin.async_spawn(function* (): Generator<*, *, *> { // eslint-disable-line func-names
    let cert = null;
    try {
      cert = yield window.cadesplugin.CreateObjectAsync('CAdESCOM.Certificate');
      yield cert.Import(certBase64);
      yield cert.FindPrivateKey();
    } catch (ex) {
      console.info('Failed to create CAdESCOM.Certificate: ', errorMessage(ex));  // eslint-disable-line no-console
      throw new Error('sign.private_key_not_found');
    }
    return cert;
  })
);


/**
 * Данные для подлписи по документу
 *
 * @param {string} recordID
 * @param {string} base64 digest
 * @param {string} signer
 */
export const signAsync = ({ recordID, digest }: SignTypeParams, signer: string): Promise<SignType> => (
  window.cadesplugin.async_spawn(function* (): Generator<*, *, *> { // eslint-disable-line func-names
    try {
      const oSignedData = yield window.cadesplugin.CreateObjectAsync('CAdESCOM.CadesSignedData');
      yield oSignedData.propset_ContentEncoding(window.cadesplugin.CADESCOM_BASE64_TO_BINARY);
      yield oSignedData.propset_Content(digest);
      const sSignedMessage = yield oSignedData.SignCades(signer, window.cadesplugin.CADESCOM_CADES_BES, true);
      console.log('%c  Подпись сформирована успешно!', 'background: #222; color: #bada55'); // eslint-disable-line no-console
      return {
        recordID,
        sign: sSignedMessage
      };
    } catch (err) {
      console.info('Возникла ошибка:', err.message); // eslint-disable-line no-console
      throw new Error('sign.private_key_not_found');
    }
  })
);

/**
 *
 * Данные для подлписи по документу
 *
 * @param {string} recordID
 * @param {string} base64 digest
 * @param {string} signer
 * @returns {{sign: *}}
 */
export const signSync = ({ recordID, digest }: SignTypeParams, signer: string): SignType => {
  try {
    const oSignedData = window.cadesplugin.CreateObject('CAdESCOM.CadesSignedData');
    oSignedData.ContentEncoding = window.cadesplugin.CADESCOM_BASE64_TO_BINARY;
    oSignedData.Content = digest;
    const sSignedMessage = oSignedData.SignCades(signer, window.cadesplugin.CADESCOM_CADES_BES, true);
    console.debug('Подпись сформирована успешно!'); // eslint-disable-line no-console
    return {
      recordID,
      sign: sSignedMessage
    };
  } catch (err) {
    console.info('Возникла ошибка:', err.message); // eslint-disable-line no-console
    throw new Error('sign.private_key_not_found');
  }
};

/**
 *
 * @param cert
 * @returns {*}
 */
export const signerSync = (cert: string): { Certificate: string, Options: any } => {
  try {
    const oSigner = window.cadesplugin.CreateObject('CAdESCOM.CPSigner');
    oSigner.Certificate = cert;
    oSigner.Options = window.cadesplugin.CAPICOM_CERTIFICATE_INCLUDE_END_ENTITY_ONLY;
    return oSigner;
  } catch (err) {
    console.info('Возникла ошибка:', err.message); // eslint-disable-line no-console
    throw new Error('sign.private_key_not_found');
  }
};

/**
 *
 * @param cert
 */
export const signerAsync = (cert: string): Promise<{propset_Certificate: Function, propset_Options: Function}> => (
  window.cadesplugin.async_spawn(function* (): Generator<*, *, *> {
    try {
      const oSigner = yield window.cadesplugin.CreateObjectAsync('CAdESCOM.CPSigner');
      yield oSigner.propset_Certificate(cert);
      yield oSigner.propset_Options(window.cadesplugin.CAPICOM_CERTIFICATE_INCLUDE_END_ENTITY_ONLY);
      return oSigner;
    } catch (err) {
      console.info('Возникла ошибка:', err.message); // eslint-disable-line no-console
      throw new Error('sign.private_key_not_found');
    }
  })
);


/**
 *
 * @returns {{loaded: boolean, enabled: boolean, version: *}}
 */
type TypePluginInfo = {
  loaded: boolean,
  enabled: boolean,
  version: string
};
export function pluginInfoSync(): TypePluginInfo {
  const result = {
    enabled: false,
    loaded: false,
    currentPluginVersion: null
  };
  try {
    const oAbout = window.cadesplugin.CreateObject('CAdESCOM.About');
    result.loaded = true;
    result.enabled = true;

    // Это значение будет проверяться сервером при загрузке демо-страницы
    result.currentPluginVersion = oAbout.PluginVersion;
    if (!result.currentPluginVersion) {
      result.currentPluginVersion = oAbout.Version;
    }
  } catch (err) {
    // Объект создать не удалось, проверим, установлен ли
    // вообще плагин. Такая возможность есть не во всех браузерах
    const mimetype = navigator.mimeTypes['application/x-cades'];
    if (mimetype) {
      result.loaded = true;
      result.enabled = !!mimetype.enabledPlugin;
    }
  }
  return {
    loaded: result.loaded,
    enabled: result.enabled,
    version: versionToString(result.currentPluginVersion, true)
  };
}

/**
 *
 */
export const pluginInfoAsync = (): Promise<{version: string, enabled: boolean}> => (
  window.cadesplugin.async_spawn(function* (): Generator<*, *, *> { // eslint-disable-line func-names
    const oAbout = yield window.cadesplugin.CreateObjectAsync('CAdESCOM.About');
    const currentPluginVersion = yield oAbout.PluginVersion;
    const pluginVersion = yield versionToString(currentPluginVersion);

    return {
      version: pluginVersion,
      enabled: true
    };
  })
);

/**
 *
 * @param e
 * @returns {*}
 */
export function errorMessage(e: {message?: string, number?: number}): {message?: string, number?: number} | string {
  let err = e.message;
  if (!err) {
    err = e;
  } else if (e.number) {
    err += `(0x${decimalToHexString(e.number)})`;  // eslint-disable-line no-undef
  }
  return err;
}

/**
 *
 * @param oVer
 * @param isSync
 * @returns {*}
 */
export function versionToString(oVer?: any, isSync?: boolean): any  { // Promise<*> | string | null| TypeOver
  if (!oVer) return null;
  if (typeof oVer === 'string' && isSync) return oVer;

  const arrVersion = [oVer.MajorVersion, oVer.MinorVersion, oVer.BuildVersion];
  return new Promise((resolve: Function) => {
    Promise.all(arrVersion).then((versions: Array<string>): Function =>
      resolve(versions.join('.'))
    );
  });
}

/**
 *
 * @param branchName
 * @param cityName
 * @param fname
 * @returns {{fNameReplace, branchNameReplace, cityNameReplace}}
 */
type TypeDistinguishedNameEncode = {
  branchName: string,
  cityName: string,
  name: string
};

type TypeDistinguishedNameEncodeReturn = {
  fNameReplace: string,
  branchNameReplace: string,
  cityNameReplace: string
};

function prepareStringForDistinguishedNameEncode(
  { branchName, cityName, name }: TypeDistinguishedNameEncode
): TypeDistinguishedNameEncodeReturn {
  const req = /"/ig;
  const repl = '';
  return {
    fNameReplace: name.replace(req, repl),
    branchNameReplace: branchName.replace(req, repl),
    cityNameReplace: cityName.replace(req, repl)
  };
}

/**
 *
 * @param encodeData
 *  CN="Firstname Lastname";
 *  OU="Отделение Романов Двор";
 *  O="7743897707 (ИНН организации)";
 *  L="Moscow";
 *  C="RU";
 *  E="name@domain.com"
 *
 *  cryptoServiceConf - получаем по ручке 'defaultValues/certReq'
 *
 *  @link https://www.cryptopro.ru/forum2/default.aspx?g=posts&t=10133
 */
type TypeUlkInner = {
  branchName: string,
  email: string,
  cityName: string,
  name: string,
  orgINN: string
};

type TypeUlk = {
  ulk: TypeUlkInner
};

type TypeCryptoServiceConf = {
  keyGenConf: {exportableKey: string},
  keyUsageOIDs: string
};

function* createPKCS10AsyncRequest(
  { ulk: { branchName, email, cityName, name, orgINN } }: TypeUlk, cryptoServiceConf: TypeCryptoServiceConf
): Generator<*, *, *> {
  const {
    keyGenConf: { exportableKey },
    keyUsageOIDs
  }: TypeCryptoServiceConf = cryptoServiceConf;

  const keyUsageOIDsSplit = keyUsageOIDs.split(';');
  const { fNameReplace, branchNameReplace, cityNameReplace } =
    prepareStringForDistinguishedNameEncode({ branchName, cityName, name });

  try {
    const PrivateKey = yield window.cadesplugin.CreateObjectAsync(CX509PrivateKey);
    const DistinguishedName = yield window.cadesplugin.CreateObjectAsync(CX500DistinguishedName);
    const objExtensionKeyUsage = yield window.cadesplugin.CreateObjectAsync(CX509ExtensionKeyUsage);
    const cObjectIds = yield window.cadesplugin.CreateObjectAsync(CObjectIds);
    const cObjectId = yield window.cadesplugin.CreateObjectAsync(CObjectId);
    const objX509ExtensionEnhancedKeyUsage = yield window.cadesplugin.CreateObjectAsync(CX509ExtensionEnhancedKeyUsage);
    const CertificateRequestPkcs10 = yield window.cadesplugin.CreateObjectAsync(CX509CertificateRequestPkcs10);
    const Enroll = yield window.cadesplugin.CreateObjectAsync(CX509Enrollment);

    yield PrivateKey.propset_KeyUsage(2);
    yield PrivateKey.propset_KeySpec(1);
    yield PrivateKey.propset_ProviderName(PROVIDER_NAME);
    yield PrivateKey.propset_ExportPolicy(exportableKey === 'YES' ? 1 : 0x00000000);
    yield PrivateKey.propset_ProviderType(75);
    yield CertificateRequestPkcs10.InitializeFromPrivateKey(0x1, PrivateKey, '');

    yield DistinguishedName.Encode(
      `CN="${fNameReplace}";OU="${branchNameReplace}";O="${orgINN}";L="${cityNameReplace}";C="RU";E="${email}"`
    );
    yield CertificateRequestPkcs10.propset_Subject(DistinguishedName);

    yield objExtensionKeyUsage.InitializeEncode(
      CERT_KEY_ENCIPHERMENT_KEY_USAGE | // eslint-disable-line space-infix-ops, no-bitwise
      CERT_DATA_ENCIPHERMENT_KEY_USAGE |
      CERT_DIGITAL_SIGNATURE_KEY_USAGE |
      CERT_NON_REPUDIATION_KEY_USAGE
    );
    const X509Extensions = yield CertificateRequestPkcs10.X509Extensions;
    yield X509Extensions.Add(objExtensionKeyUsage);

    yield Promise.all(
      keyUsageOIDsSplit.map((keyUsage: string): Promise<*> => cObjectId.InitializeFromValue(keyUsage))
    );

    // yield cObjectId.InitializeFromValue(REGISTRATION_AUTHORITY_USER);
    yield cObjectIds.Add(cObjectId);
    yield objX509ExtensionEnhancedKeyUsage.InitializeEncode(cObjectIds);

    yield X509Extensions.Add(objX509ExtensionEnhancedKeyUsage);


    yield Enroll.InitializeFromRequest(CertificateRequestPkcs10);

    const pkcs10 = yield Enroll.CreateRequest(CREATE_REQUEST);
    const containerName = yield PrivateKey.ContainerName;

    return {
      pkcs10,
      containerName
    };
  } catch (ex) {
    console.info('Failed createPKCS10AsyncRequest', errorMessage(ex));  // eslint-disable-line no-console
    throw ex;
  }
}

export function createPKCS10SyncRequest(
  { ulk: { branchName, email, cityName, name, orgINN } }: TypeUlk, cryptoServiceConf: TypeCryptoServiceConf
): {pkcs10: string, containerName: string } {
  const {
    keyGenConf: { exportableKey },
    keyUsageOIDs
  } = cryptoServiceConf;

  const keyUsageOIDsSplit: Array<string> = keyUsageOIDs.split(';');
  const { fNameReplace, branchNameReplace, cityNameReplace } =
    prepareStringForDistinguishedNameEncode({ branchName, cityName, name });

  const PrivateKey = window.cadesplugin.CreateObject(CX509PrivateKey);
  const objRequest = window.cadesplugin.CreateObject(CX509CertificateRequestPkcs10);
  const objX509ExtensionEnhancedKeyUsage = window.cadesplugin.CreateObject(CX509ExtensionEnhancedKeyUsage);
  const DistinguishedName = window.cadesplugin.CreateObject(CX500DistinguishedName);
  const objObjectIds = window.cadesplugin.CreateObject(CObjectIds);
  const objObjectId = window.cadesplugin.CreateObject(CObjectId);
  const KeyUsageExtension = window.cadesplugin.CreateObject(CX509ExtensionKeyUsage);
  const objEnroll = window.cadesplugin.CreateObject(CX509Enrollment);

  PrivateKey.ProviderName = PROVIDER_NAME;
  PrivateKey.ProviderType = 75;
  PrivateKey.ExportPolicy = exportableKey === 'YES' ? 1 : 0x00000000;
  PrivateKey.KeyUsage = 2;
  PrivateKey.KeySpec = 1;
  objRequest.InitializeFromPrivateKey(0x1, PrivateKey, '');

  DistinguishedName.Encode(
    `CN="${fNameReplace}";OU="${branchNameReplace}";O="${orgINN}";L="${cityNameReplace}";C="RU";E="${email}"`
  );

  objRequest.Subject = DistinguishedName;

  keyUsageOIDsSplit.map((keyUsage: string): string => objObjectId.InitializeFromValue(keyUsage));
  // objObjectId.InitializeFromValue(REGISTRATION_AUTHORITY_USER);
  objObjectIds.Add(objObjectId);
  objX509ExtensionEnhancedKeyUsage.InitializeEncode(objObjectIds);
  objRequest.X509Extensions.Add(objX509ExtensionEnhancedKeyUsage);

  KeyUsageExtension.InitializeEncode(
    CERT_KEY_ENCIPHERMENT_KEY_USAGE | // eslint-disable-line space-infix-ops, no-bitwise
    CERT_DATA_ENCIPHERMENT_KEY_USAGE |
    CERT_DIGITAL_SIGNATURE_KEY_USAGE |
    CERT_NON_REPUDIATION_KEY_USAGE
  );
  objRequest.X509Extensions.Add(KeyUsageExtension);
  objEnroll.InitializeFromRequest(objRequest);
  const pkcs10 = objEnroll.CreateRequest(CREATE_REQUEST);

  return {
    pkcs10,
    containerName: PrivateKey.ContainerName
  };
}


/**
 * обертка над CryptoPro плагином с вызовом разных методов  SYNC и ASYNC
 */
const CryptoProService = {
  pluginInfo(): Promise<*> {
    try {
      console.log(pluginInfoAsync(), 'isPluginAsync() isPluginAsync() isPluginAsync() '); // eslint-disable-line no-console
      const result = isPluginAsync()
        ? pluginInfoAsync()
        : pluginInfoSync();
      return Promise.resolve(result);
    } catch (error) {
      return Promise.reject();
    }
  },

  createDetachedSign(doc: SignTypeParams, signer: string): Promise<*> {
    const result = (isPluginAsync()
      ? signAsync(doc, signer)
      : Promise.resolve(signSync(doc, signer)));

    return result.catch((err: { message: string }) => {
      throw new Error(err.message);
    });
  },

  findCert(certBase64: string): Promise<*> {
    return isPluginAsync()
      ? getCertAsync(certBase64)
      : Promise.resolve(getCertSync(certBase64));
  },

  signer(cert: string): Promise<*> {
    return isPluginAsync()
      ? signerAsync(cert)
      : Promise.resolve(signerSync(cert));
  },

  isOnToken(cert: TypePrivateKey): Promise<*> {
    return isPluginAsync()
      ? isOnTokenAsync(cert)
      : Promise.resolve(isOnTokenSync(cert));
  },

  createPKCS10Request(data: TypeUlk, conf: TypeCryptoServiceConf): Promise<*> | Generator<*, *, *> {
    return isPluginAsync()
      ? createPKCS10AsyncRequest(data, conf)
      : Promise.resolve(createPKCS10SyncRequest(data, conf));
  },

  checkWorkingPlugin() {
    cryptoProPlugin().checkPluginWorking();
  }
};

export default CryptoProService;
