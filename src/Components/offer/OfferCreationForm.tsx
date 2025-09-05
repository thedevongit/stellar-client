import React, { useState } from "react";
import {
  Stepper,
  Button,
  Group,
  TextInput,
  Textarea,
  Select,
  Switch,
  NumberInput,
  Modal,
  useMantineTheme,
} from "@mantine/core";
import { DateInput } from '@mantine/dates';
import { IconInfoCircle } from "@tabler/icons-react";
import {Client, InitParams, OfferInitParams} from "soroban-dsponsor";
import { useWallet } from "../../web3";
import { getChainDatas, stellarTokenDecimal } from "../../utils";
import { useOffers } from "../../hooks/offer/useOffers";
import { useDispatch } from "react-redux";
import { setNotification } from "../../stores/common";

const imageRatios = [
  { value: "1:1", label: "1:1" },
  { value: "16:9", label: "16:9" },
  { value: "4:3", label: "4:3" },
];

const currencies = [
  { value: "USDS", label: "USDS", address: "CDN4DRIVEZMCMSMO2ZADNXBWO3JOT6NAN7GBEDUL2VTMOJ6QU65RBZGS" },
  { value: "XLM", label: "XLM", address: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC" },
  { value: "custom", label: "Custom" },
];

const stepTitles = [
  "Offer Type & Availability",
  "Name & Description",
  "URL & Image",
  "Validity & Financials"
];

const OfferCreationForm: React.FC = () => {
  const [active, setActive] = useState(0);
  const [form, setForm] = useState({
    adType: 'image',
    imageRatio: '',
    link: true,
    linkUrl: '',
    text: true,
    textValue: '',
    adCount: 1,
    title: '',
    description: '',
    exposureUrl: '',
    illustration: '',
    legalUrl: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    price: 1,
    currency: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    royalties: 10,
    customCurrencyAddress: '',
  });
  const [currencyError, setCurrencyError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [progressStep, setProgressStep] = useState<0 | 1 | 2>(0); // 0: idle, 1: NFT, 2: Offer
  const {walletAddress, createAssembledTransaction} = useWallet()
  const dispatch = useDispatch();
  const {data: offers} = useOffers('stellart', walletAddress);
  const nextStep = () => setActive((current) => (current < 3 ? current + 1 : current));
  const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));

  // Fix for Switches: use checked prop and onChange with value
  const handleSwitch = (field: 'link' | 'text') => (value: boolean) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  // Helper for currency display
  const getCurrencyLabel = () => {
    if (form.currency === 'custom') {
      return `Custom (${form.customCurrencyAddress.slice(0, 3) + '...' + form.customCurrencyAddress.slice(-3) || 'No address'})`;
    }
    const found = currencies.find(c => c.address === form.currency);
    return found?.label || 'Unknown';
  };

  // Custom currency validation
  const handleCurrencyChange = (v: string | null) => {
    if (v === 'custom') {
      setForm(f => ({ ...f, currency: 'custom', customCurrencyAddress: '' }));
    } else {
      const found = currencies.find(c => c.value === v);
      setForm(f => ({ ...f, currency: found?.address || '', customCurrencyAddress: '' }));
    }
    setCurrencyError(null);
  };

  const handleCustomCurrencyAddress = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, customCurrencyAddress: e.target.value }));
    if (!/^0x[a-fA-F0-9]{40}$/.test(e.target.value)) {
      setCurrencyError('The currency is not valid.');
    } else {
      setCurrencyError(null);
    }
  };

  // Progress bar width
  const progress = ((active + 1) / 4) * 100;

  // Animation classes for step transitions
  const stepAnimation = "transition-all duration-500 ease-in-out opacity-100 translate-y-0";

  const formatStellarData = async () : Promise<[InitParams,OfferInitParams]> => {
    let decimal = await stellarTokenDecimal('stellart', walletAddress, form.currency);
    const initParams: InitParams = {
      name: form.title.toString() + " - " + "NFT",
      symbol: form.title.split(' ').map(word => word[0]).join(''),
      base_uri: form.illustration,
      contract_uri: form.illustration,
      minter: walletAddress,
      max_supply: Number(form.adCount),
      forwarder: walletAddress,
      initial_owner: walletAddress,
      royalty_bps: Number(form.royalties * 10),
      currencies: [form.currency],
      default_native_price: {
        enabled: true,
        amount: BigInt(form.price * 10 ** Number(decimal)),
      },
      prices: [BigInt(form.price * 10 ** Number(decimal))],
      allowed_token_ids: [],
      apply_tokens_allowlist: false,
    }
    const offerInitParams: OfferInitParams = {
     name: form.title.toString(),
     offer_metadata: JSON.stringify({ 
      title: form.title,
      startDate: form.startDate?.toISOString(),
      endDate: form.endDate?.toISOString(),
      imageRatio: form.imageRatio,
      description: form.description,
      royalties: form.royalties,
      illustration: form.illustration,
      price: form.price,
      currency: getCurrencyLabel(),
      currencyAddress: form.currency,
      legalUrl: form.legalUrl,
      exposureUrl: form.exposureUrl,
      adType: form.adType,
      text: form.text,
      link: form.link,
     }),
     options:{
      admins: [walletAddress],
      validators: [walletAddress],
      ad_parameters: [
        form.text ? "text" : "text", // else condition to change to allow dynamic ad parameters
        form.link ? "link" : "link", // else condition to change to allow dynamic ad parameters
      ]
     }
    }
    return [initParams,offerInitParams];
  };

  const handleSubmit = async () => {
    setProgressModalOpen(true);
    setProgressStep(0);
    try {
      // Step 1: Create NFT
      let [initParams, offerInitParams] = await formatStellarData();
      let client = new Client({
        rpcUrl: getChainDatas('stellart').rpc,
        networkPassphrase: getChainDatas('stellart').networkPassphrase,
        contractId: getChainDatas('stellart').address,
        publicKey: walletAddress,
      });
      let assembledCreateNFTTx = await client.create_dsponsor_nft({
        init_params: initParams,
        salt: Buffer.from(window.crypto.getRandomValues(new Uint8Array(32)))
      });
      let nftAddress = await createAssembledTransaction(assembledCreateNFTTx);
      if (nftAddress != false) 
        setProgressStep(1);
      // Step 2: Create Offer
      console.log({nftAddress});
      console.log({offerInitParams});
      let assembledCreateOfferTx = await client.create_offer({
        nft_contract: nftAddress,
        offer_params: offerInitParams
      });
      let offerId = await createAssembledTransaction(assembledCreateOfferTx);
      if (offerId != false)
        setProgressStep(2);
        dispatch(
          setNotification({
            isNotified: true,
            type: "Success",
            message: "Offer created successfully",
          })
        );
      // Success: you can close modal or show a success message
      setTimeout(() => setProgressModalOpen(false), 1200);
    } catch (e) {
      console.log({e});
      
      dispatch(
        setNotification({
          isNotified: true,
          type: "Error",
          message: e.message,
        })
      );
      // Optionally handle error and close modal
      setProgressModalOpen(false);
    }
  };

  const validateStep = () => {
    if (active === 0) {
      if (!form.imageRatio) {
        dispatch(setNotification({ isNotified: true, type: "Info", message: "Please select an image ratio." }));
        return false;
      }
      if (form.adCount < 1) {
        dispatch(setNotification({ isNotified: true, type: "Info", message: "Please set the number of ads (min 1)." }));
        return false;
      }
    }
    if (active === 1) {
      if (!form.title) {
        dispatch(setNotification({ isNotified: true, type: "Info", message: "Please provide a title." }));
        return false;
      }
      if (!form.description) {
        dispatch(setNotification({ isNotified: true, type: "Info", message: "Please provide a description." }));
        return false;
      }
    }
    if (active === 2) {
      if (!form.exposureUrl) {
        dispatch(setNotification({ isNotified: true, type: "Info", message: "Please provide an exposure URL." }));
        return false;
      }
      if (!form.illustration) {
        dispatch(setNotification({ isNotified: true, type: "Info", message: "Please provide an illustration URL." }));
        return false;
      }
    }
    if (active === 3) {
      if (!form.startDate || !form.endDate) {
        dispatch(setNotification({ isNotified: true, type: "Info", message: "Please select a start and end date." }));
        return false;
      }
      if (!form.price || form.price < 1) {
        dispatch(setNotification({ isNotified: true, type: "Info", message: "Please set a valid price." }));
        return false;
      }
      if (form.currency === "custom" && !form.customCurrencyAddress) {
        dispatch(setNotification({ isNotified: true, type: "Info", message: "Please provide a custom currency address." }));
        return false;
      }
    }
    return true;
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative">
      {/* Glassmorphism + gradient border + shadow */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-purple-700/40 via-purple-400/20 to-transparent blur-xl opacity-60 pointer-events-none z-0" />
      <div className="relative z-10 rounded-3xl bg-[#1a1b23]/80 backdrop-blur-xl border border-purple-900/40 shadow-2xl p-10">
        {/* Progress bar */}
        <div className="w-full h-2 mb-8 rounded-full bg-[#23243a] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-purple-400 to-purple-700 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Stepper */}
        <Stepper
          active={active}
          onStepClick={setActive}
          breakpoint="sm"
          color="violet"
          classNames={{
            steps: 'mb-8',
            step: 'text-white',
          }}
        >
          {stepTitles.map((title, idx) => (
            <Stepper.Step
              key={title}
              label={
                <span
                  className="text-base md:text-lg font-bold tracking-wide text-white/90 text-center whitespace-normal leading-tight block max-w-[110px] mx-auto"
                  style={{ wordBreak: 'break-word' }}
                >
                  {title}
                </span>
              }
            />
          ))}
        </Stepper>
        {/* Animated section title */}
        <h1 className="text-3xl md:text-4xl font-extrabold mb-8 text-center bg-gradient-to-r from-purple-400 via-purple-200 to-purple-600 bg-clip-text text-transparent animate-gradient-x">
          {stepTitles[active]}
        </h1>
        {/* Step content with fade/slide animation */}
        <div className={stepAnimation}>
          {active === 0 && (
            <div className="space-y-8">
              <h2 className="text-xl font-bold text-white mb-2">Type of ad space for this offer <span className="text-purple-400">*</span></h2>
              <p className="text-gray-400 mb-4">Select the appropriate type.</p>
              <div className="bg-purple-600/10 rounded-2xl p-6 flex flex-col gap-4 shadow-lg">
                <div className="flex items-center gap-4">
                  <span className="text-white font-semibold">Image Ad Space</span>
                  <IconInfoCircle size={18} className="text-gray-400" />
                </div>
                <Select
                  label="Select Image Ratio"
                  placeholder="1:1"
                  data={imageRatios}
                  value={form.imageRatio}
                  onChange={(v) => setForm(f => ({ ...f, imageRatio: v || '' }))}
                  required
                  classNames={{
                    label: 'text-white',
                    input: 'bg-[#13141a] text-white border-gray-700 focus:ring-2 focus:ring-purple-500',
                    dropdown: 'bg-[#1a1b23] text-white',
                  }}
                  styles={{
                    dropdown: { backgroundColor: '#1a1b23', color: 'white' },
                    input: { backgroundColor: '#13141a', color: 'white' },
                  }}
                />
              </div>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <span className="block text-white font-semibold mb-2">Link</span>
                  <Switch
                    checked={form.link}
                    onChange={event => handleSwitch('link')(event.currentTarget.checked)}
                    size="md"
                    color="violet"
                    label={form.link ? 'Yes' : 'No'}
                    classNames={{
                      track: 'bg-[#23243a] border border-gray-700',
                      thumb: form.link ? 'bg-violet-600' : 'bg-gray-500',
                      label: 'text-white ml-2',
                    }}
                  />
                </div>
                <div className="flex-1">
                  <span className="block text-white font-semibold mb-2">Text</span>
                  <Switch
                    checked={form.text}
                    onChange={event => handleSwitch('text')(event.currentTarget.checked)}
                    size="md"
                    color="violet"
                    label={form.text ? 'Yes' : 'No'}
                    classNames={{
                      track: 'bg-[#23243a] border border-gray-700',
                      thumb: form.text ? 'bg-violet-600' : 'bg-gray-500',
                      label: 'text-white ml-2',
                    }}
                  />
                </div>
              </div>
              <NumberInput
                label="Number of ads to display for this offer"
                min={1}
                value={form.adCount}
                onChange={v => setForm(f => ({ ...f, adCount: v as number }))}
                classNames={{ label: 'text-white', input: 'bg-[#13141a] text-white border-gray-700 focus:ring-2 focus:ring-purple-500' }}
                required
              />
            </div>
          )}
          {active === 1 && (
            <div className="space-y-8">
              <TextInput
                label={<span className="text-white">Title <span className="text-purple-400">*</span></span>}
                placeholder="Provide a title for your offer."
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e?.target?.value ?? '' }))}
                required
                classNames={{ input: 'bg-[#13141a] text-white border-gray-700 focus:ring-2 focus:ring-purple-500' }}
              />
              <Textarea
                label={<span className="text-white">Description <span className="text-purple-400">*</span></span>}
                placeholder="Describe your offer, location, and content expectations."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e?.target?.value ?? '' }))}
                minRows={5}
                maxLength={2000}
                className="mt-4"
                classNames={{ input: 'bg-[#13141a] text-white border-gray-700 focus:ring-2 focus:ring-purple-500' }}
              />
              <div className="text-green-500 mt-2 text-sm">
                {2000 - (form.description?.length || 0)} characters remaining
              </div>
            </div>
          )}
          {active === 2 && (
            <div className="space-y-8">
              <TextInput
                label={<span className="text-white">Where will ads be exposed? <span className="text-purple-400">*</span></span>}
                placeholder="Provide a URL, app name, or platform description."
                value={form.exposureUrl}
                onChange={e => setForm(f => ({ ...f, exposureUrl: e?.target?.value ?? '' }))}
                required
                classNames={{ input: 'bg-[#13141a] text-white border-gray-700 focus:ring-2 focus:ring-purple-500' }}
              />
              <div>
                <span className="block text-white font-semibold mb-2">Illustration <span className="text-purple-400">*</span></span>
                <TextInput
                  placeholder="Enter image URL"
                  value={form.illustration}
                  onChange={e => setForm(f => ({ ...f, illustration: e.target.value }))}
                  className="mt-2"
                  classNames={{ input: 'bg-[#13141a] text-white border-gray-700 focus:ring-2 focus:ring-purple-500' }}
                  required
                />
              </div>
              <div>
                <span className="block text-white font-semibold mb-2">Legal (URL only)</span>
                <p className="text-gray-400 text-sm mb-2">Provide the terms of use for the ad space you are offering. <a href="#" className="text-purple-400 underline">template</a></p>
                <TextInput
                  placeholder="Enter terms of use URL"
                  value={form.legalUrl}
                  onChange={e => setForm(f => ({ ...f, legalUrl: e?.target?.value ?? '' }))}
                  className="mt-2"
                  classNames={{ input: 'bg-[#13141a] text-white border-gray-700 focus:ring-2 focus:ring-purple-500' }}
                />
              </div>
            </div>
          )}
          {active === 3 && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-1">
                  <span className="block text-white font-semibold mb-2">Validity period <span className="text-purple-400">*</span></span>
                  <Group spacing="xs">
                    <DateInput
                      value={form.startDate}
                      onChange={date => setForm(f => ({ ...f, startDate: date }))}
                      placeholder="Start date"
                      classNames={{ input: 'bg-[#13141a] text-white border-gray-700 focus:ring-2 focus:ring-purple-500' }}
                    />
                    <DateInput
                      value={form.endDate}
                      onChange={date => setForm(f => ({ ...f, endDate: date }))}
                      placeholder="End date"
                      classNames={{ input: 'bg-[#13141a] text-white border-gray-700 focus:ring-2 focus:ring-purple-500' }}
                    />
                  </Group>
                </div>
              </div>
              <NumberInput
              type="number"
                label={<span className="text-white">Unit selling price <span className="text-purple-400">*</span></span>}
                value={form.price}
                onChange={v => setForm(f => ({ ...f, price: v as number }))}
                min={1}
                classNames={{ input: 'bg-[#13141a] text-white border-gray-700 focus:ring-2 focus:ring-purple-500' }}
                required
              />
              <div className="mt-8">
                <span className="block text-white font-semibold mb-2">Currency <span className="text-purple-400">*</span></span>
                <div className="flex flex-col md:flex-row gap-4 md:items-center">
                  <Select
                    data={currencies.map(c => ({
                      value: c.value,
                      label: c.label,
                    }))}
                    value={currencies.find(c => c.address === form.currency)?.value || 'custom'}
                    onChange={handleCurrencyChange}
                    classNames={{
                      input: 'bg-[#13141a] text-white border-gray-700 focus:ring-2 focus:ring-purple-500',
                      item: 'bg-[#1a1b23] text-white',
                      dropdown: 'bg-[#1a1b23] text-white',
                    }}
                    styles={{
                      dropdown: { backgroundColor: '#1a1b23', color: 'white' },
                      input: { backgroundColor: '#13141a', color: 'white' },
                    }}
                  />
                  {form.currency === 'custom' && (
                    <TextInput
                      placeholder="Contract address"
                      value={form.customCurrencyAddress}
                      onChange={handleCustomCurrencyAddress}
                      className={
                        `w-full md:w-[320px] ${currencyError ? 'border border-red-500' : 'border border-gray-700'} bg-[#1a1b23] text-white rounded-lg px-4 py-2`}
                      classNames={{ input: `bg-[#1a1b23] text-white ${currencyError ? 'border-red-500' : 'border-gray-700'} focus:ring-2 focus:ring-purple-500'` }}
                    />
                  )}
                </div>
                {currencyError && (
                  <div className="text-red-500 text-sm mt-2">{currencyError}</div>
                )}
              </div>
              <NumberInput
                label={<span className="text-white">Royalties <span className="text-purple-400">*</span></span>}
                value={form.royalties}
                onChange={v => setForm(f => ({ ...f, royalties: v as number }))}
                min={0}
                max={100}
                rightSection={<span className="text-gray-400">%</span>}
                className="mt-2"
                classNames={{ input: 'bg-[#13141a] text-white border-gray-700 focus:ring-2 focus:ring-purple-500' }}
                required
              />
            </div>
          )}
        </div>
        {/* Navigation Buttons */}
        <Group position="apart" mt="xl">
          <Button
            variant="outline"
            color="violet"
            onClick={prevStep}
            disabled={active === 0}
            className="px-8 py-2 rounded-xl shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1"
          >
            Back
          </Button>
          {active < 3 ? (
            <Button
              color="violet"
              onClick={() => {
                if (validateStep()) nextStep();
              }}
              className="px-8 py-2 rounded-xl shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1"
            >
              Next
            </Button>
          ) : (
            <Button
              color="violet"
              className="px-8 py-2 rounded-xl shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1"
              onClick={() => {
                if (validateStep()) setPreviewOpen(true);
              }}
            >
              Show preview
            </Button>
          )}
        </Group>
        {/* Preview Modal */}
        <Modal
          opened={previewOpen}
          onClose={() => setPreviewOpen(false)}
          centered
          size="lg"
          radius="xl"
          classNames={{ body: 'bg-[#181926] rounded-2xl p-8', header: 'border-b border-gray-800' }}
          title={<span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">Offer Preview</span>}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-gray-400 text-sm mb-1">Ad Type</div>
                <div className="text-white font-semibold">{form.adType === 'image' ? 'Image Ad Space' : form.adType}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Image Ratio</div>
                <div className="text-white font-semibold">{form.imageRatio}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Link</div>
                <div className="text-white font-semibold">{form.link ? form.linkUrl || 'Yes' : 'No'}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Text</div>
                <div className="text-white font-semibold">{form.text ? form.textValue || 'Yes' : 'No'}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Number of Ads</div>
                <div className="text-white font-semibold">{form.adCount}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Title</div>
                <div className="text-white font-semibold">{form.title}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-gray-400 text-sm mb-1">Description</div>
                <div className="text-white font-semibold whitespace-pre-line">{form.description}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-gray-400 text-sm mb-1">Exposure URL / Platform</div>
                <div className="text-white font-semibold">{form.exposureUrl}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Legal URL</div>
                <div className="text-white font-semibold">{form.legalUrl}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Illustration</div>
                <div className="text-white font-semibold">{form.illustration ? 'Image URL' : 'No image URL provided'}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Start Date</div>
                <div className="text-white font-semibold">{form.startDate ? form.startDate.toLocaleDateString() : '-'}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">End Date</div>
                <div className="text-white font-semibold">{form.endDate ? form.endDate.toLocaleDateString() : '-'}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Unit Price</div>
                <div className="text-white font-semibold">{form.price}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Currency</div>
                <div className="text-white font-semibold">{getCurrencyLabel()}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Royalties</div>
                <div className="text-white font-semibold">{form.royalties}%</div>
              </div>
            </div>
            <Group position="right">
              <Button color="violet" size="md" radius="xl" className="px-8 py-2 shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1" onClick={async () => await handleSubmit()}>
                Create
              </Button>
            </Group>
          </div>
        </Modal>
        <Modal
          opened={progressModalOpen}
          onClose={() => {}}
          centered
          withCloseButton={false}
          size="sm"
          radius="xl"
          classNames={{ body: 'bg-[#181926] rounded-2xl p-8', header: 'border-b border-gray-800' }}
        >
          <div className="flex flex-col gap-6 items-center">
            <div className="flex flex-col items-center gap-2">
              <div className={`rounded-full p-3 ${progressStep > 0 ? 'bg-green-500/20' : 'bg-purple-500/20'}`}>
                {progressStep > 0 ? (
                  <span className="text-green-400 text-2xl">✔️</span>
                ) : (
                  <span className="text-purple-400 text-2xl">🖼️</span>
                )}
              </div>
              <div className="text-lg font-bold text-white">Deploy Offer Contract</div>
              <div className="text-sm text-purple-300">{progressStep === 0 ? "Processing..." : "Done"}</div>
            </div>
            <div className="border-l-2 border-purple-700 h-8" />
            <div className="flex flex-col items-center gap-2">
              <div className={`rounded-full p-3 ${progressStep === 2 ? 'bg-green-500/20' : 'bg-purple-500/20'}`}>
                {progressStep === 2 ? (
                  <span className="text-green-400 text-2xl">✔️</span>
                ) : (
                  <span className="text-purple-400 text-2xl">💼</span>
                )}
              </div>
              <div className="text-lg font-bold text-white">Create Offer</div>
              <div className="text-sm text-purple-300">{progressStep < 2 ? "Waiting..." : "Done"}</div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default OfferCreationForm; 