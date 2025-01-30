const { bgYellow } = require('colors');
const mongoose = require('mongoose');
module.exports = {

    // tbl_bl: new mongoose.Schema({

    //     bl_id: { type: Number, required: true, default: 0 },
    //     memo_id: { type: Number, required: false, default: null },
    //     document_type: { type: Number, required: false, default: null },
    //     trnsport_mode: { type: Number, required: false, default: null },
    //     container_plan: { type: Number, required: false, default: null },
    //     bl_status: { type: String, required: false, default: null },
    //     bl_document_type: { type: String, required: false, default: null },
    //     bl_type: { type: Number, required: false, default: null },
    //     mbl_date: { type: String, required: false, default: null },
    //     mbl_no: { type: String, required: false, default: null },
    //     hbl_no: { type: String, required: false, default: null },
    //     hbl_date: { type: String, required: false, default: null },
    //     no_of_bl: { type: Number, required: false, default: null },
    //     fcr_no: { type: Number, required: false, default: null },
    //     fcr_date: { type: String, required: false, default: null },
    //     shipper_name: { type: String, required: false, default: null },
    //     shipper_name_text: { type: String, required: false, default: null },
    //     shipper_branch: { type: String, required: false, default: null },
    //     shipper_branch_text: { type: String, required: false, default: null },
    //     shipper_address: { type: String, required: false, default: null },
    //     shipper_area: { type: String, required: false, default: null },
    //     shipper_pincode: { type: String, required: false, default: null },
    //     shipper_city: { type: String, required: false, default: null },
    //     shipper_state: { type: String, required: false, default: null },
    //     shipper_country: { type: String, required: false, default: null },
    //     consignee_bank: { type: String, required: false, default: null },
    //     consignee_bank_text: { type: String, required: false, default: null },
    //     bank_branch: { type: String, required: false, default: null },
    //     bank_branch_text: { type: String, required: false, default: null },
    //     consignee_name: { type: String, required: false, default: null },
    //     consignee_name_text: { type: String, required: false, default: null },
    //     consignee_branch: { type: String, required: false, default: null },
    //     consignee_branch_text: { type: String, required: false, default: null },
    //     consignee_address: { type: String, required: false, default: null },
    //     consignee_area: { type: String, required: false, default: null },
    //     consignee_pincode: { type: String, required: false, default: null },
    //     consignee_city: { type: String, required: false, default: null },
    //     consignee_state: { type: String, required: false, default: null },
    //     consignee_country: { type: String, required: false, default: null },
    //     consignee_bank_branch: { type: String, required: false, default: null },
    //     consignee_bank_branch_text: { type: String, required: false, default: null },
    //     notifying_party1_name: { type: String, required: false, default: null },
    //     notifying_party1_name_text: { type: String, required: false, default: null },
    //     notifying_party1_branch: { type: String, required: false, default: null },
    //     notifying_party1_branch_text: { type: String, required: false, default: null },
    //     notifying_party1_add: { type: String, required: false, default: null },
    //     notifying_party1_pincode: { type: String, required: false, default: null },
    //     notifying_party1_city: { type: String, required: false, default: null },
    //     notifying_party1_state: { type: String, required: false, default: null },
    //     notifying_party1_country: { type: String, required: false, default: null },
    //     notifying_party2_name: { type: String, required: false, default: null },
    //     notifying_party2_name_text: { type: String, required: false, default: null },
    //     notifying_party2_branch: { type: String, required: false, default: null },
    //     notifying_party2_branch_text: { type: String, required: false, default: null },
    //     notifying_party2_add: { type: String, required: false, default: null },
    //     notifying_party2_pincode: { type: String, required: false, default: null },
    //     notifying_party2_city: { type: String, required: false, default: null },
    //     notifying_party2_state: { type: String, required: false, default: null },
    //     notifying_party2_country: { type: String, required: false, default: null },
    //     notifying_party3_name: { type: String, required: false, default: null },
    //     notifying_party3_name_text: { type: String, required: false, default: null },
    //     notifying_party3_branch: { type: String, required: false, default: null },
    //     notifying_party3_branch_text: { type: String, required: false, default: null },
    //     notifying_party3_add: { type: String, required: false, default: null },
    //     notifying_party3_pincode: { type: String, required: false, default: null },
    //     notifying_party3_city: { type: String, required: false, default: null },
    //     notifying_party3_state: { type: String, required: false, default: null },
    //     notifying_party3_country: { type: String, required: false, default: null },
    //     hbl_of: { type: Number, required: false, default: null },
    //     hbl_of_text: { type: String, required: false, default: null },
    //     delivery_agent: { type: Number, required: false, default: null },
    //     delivery_agent_text: { type: String, required: false, default: null },
    //     delivery_agent_address: { type: String, required: false, default: null },
    //     delivery_agent_city: { type: String, required: false, default: null },
    //     delivery_agent_state: { type: String, required: false, default: null },
    //     delivery_agent_country: { type: String, required: false, default: null },
    //     delivery_agent_pin: { type: String, required: false, default: null },
    //     load_port_agent: { type: Number, required: false, default: null },
    //     load_port_agent_text: { type: String, required: false, default: null },
    //     load_port_line: { type: String, required: false, default: null },
    //     load_port_line_text: { type: String, required: false, default: null },
    //     nominated_agent: { type: String, required: false, default: null },
    //     nomnated_agent_text: { type: String, required: false, default: null },
    //     load_port_cha: { type: String, required: false, default: null },
    //     load_port_cha_text: { type: String, required: false, default: null },
    //     discharge_port_agent: { type: Number, required: false, default: null },
    //     discharge_port_agent_text: { type: String, required: false, default: null },
    //     vesselname_flightno_id: { type: Number, required: false, default: null },
    //     vesselname_flightno_text: { type: String, required: false, default: null },
    //     voyno_flightdatetime_id: { type: Number, required: false, default: null },
    //     voyno_flightdatetime_text: { type: String, required: false, default: null },
    //     plr_id: { type: Number, required: false, default: null },
    //     plr_text: { type: String, required: false, default: null },
    //     pol_id: { type: Number, required: false, default: null },
    //     pol_text: { type: String, required: false, default: null },
    //     pod_id: { type: Number, required: false, default: null },
    //     pod_text: { type: String, required: false, default: null },
    //     fpd_id: { type: Number, required: false, default: null },
    //     fpd_text: { type: String, required: false, default: null },
    //     pre_carriage: { type: String, required: false, default: null },
    //     shipped_on_date: { type: String, required: false, default: null },
    //     bl_issue_place: { type: String, required: false, default: null },
    //     bl_issue_place_text: { type: String, required: false, default: null },
    //     date_of_issue: { type: String, required: false, default: null },
    //     release_date: { type: String, required: false, default: null },
    //     prepaid_collect: { type: String, required: false, default: null },
    //     prepaid_payble_at_text: { type: String, required: false, default: null },
    //     payable_at: { type: String, required: false, default: null },
    //     payable_at_text: { type: String, required: false, default: null },
    //     no_of_free_days: { type: String, required: false, default: null },
    //     no_of_packages: { type: Number, required: false, default: null },
    //     package_type: { type: Number, required: false, default: null },
    //     gross_wt: { type: Number, required: false, default: null },
    //     gross_wt_unit: { type: String, required: false, default: null },
    //     net_wt: { type: Number, required: false, default: null },
    //     net_wt_ynit: { type: Number, required: false, default: null },
    //     measurement: { type: String, required: false, default: null },
    //     measurement_unit: { type: Number, required: false, default: null },
    //     cargo_type: { type: Number, required: false, default: null },
    //     imo_code: { type: String, required: false, default: null },
    //     un_no: { type: String, required: false, default: null },
    //     pg_no: { type: String, required: false, default: null },
    //     flash_point: { type: String, required: false, default: null },
    //     desc_of_goods: { type: String, required: false, default: null },
    //     marks_nos: { type: String, required: false, default: null },
    //     remarks: { type: String, required: false, default: null },
    //     added_by: { type: Number, required: false, default: null },
    //     added_on: { type: String, required: false, default: null },
    //     updated_by: { type: Number, required: false, default: null },
    //     updated_on: { type: String, required: false, default: null },
    //     stuffing_type: { type: String, required: false, default: null },
    //     clauses: { type: String, required: false, default: null },
    //     m_vesselname_flightno_id: { type: String, required: false, default: null },
    //     m_voyno_flightdatetime_id: { type: String, required: false, default: null },
    //     m_gross_weight: { type: String, required: false, default: null },
    //     m_gross_weight_unit_id: { type: String, required: false, default: null },
    //     m_net_weight: { type: String, required: false, default: null },
    //     m_net_weight_unit_id: { type: String, required: false, default: null },
    //     m_measurement: { type: String, required: false, default: null },
    //     m_measurement_unit_id: { type: String, required: false, default: null },
    //     mbl_type_of_packages: { type: String, required: false, default: null },
    //     mbl_no_of_packages: { type: String, required: false, default: null },
    //     shippingline_airline_id: { type: String, required: false, default: null },
    //     shippingline_airline_agent_id: { type: String, required: false, default: null },
    //     cha_id: { type: String, required: false, default: null },
    //     tranship_id: { type: String, required: false, default: null },
    //     special_instruction: { type: String, required: false, default: null },
    //     gateway_igm_no: { type: String, required: false, default: null },
    //     gateway_igm_date: { type: String, required: false, default: null },
    //     gateway_inward_date: { type: String, required: false, default: null },
    //     mode_of_communication_id: { type: String, required: false, default: null },
    //     no_of_container: { type: Number, required: false, default: null },
    //     discharge_port_agent1: { type: String, required: false, default: null },
    //     bl_issue_type: { type: String, required: false, default: null },
    //     mbl_chargeable_wt: { type: String, required: false, default: null },
    //     hbl_chargeable_wt: { type: String, required: false, default: null },
    //     igm_no: { type: String, required: false, default: null },
    //     igm_date: { type: String, required: false, default: null },
    //     eta: { type: String, required: false, default: null },
    //     nominated_area_id: { type: String, required: false, default: null },
    //     status: { type: String, required: false, default: null },
    //     isprintSplInstruction: { type: String, required: false, default: null },
    //     line_no: { type: String, required: false, default: null },
    //     line_sub_no: { type: String, required: false, default: null },
    //     type_of_shipment_id: { type: Number, required: false, default: null },
    //     delivery_type: { type: Number, required: false, default: null },
    //     ff_pol_agent: { type: String, required: false, default: null },
    //     principal_ff: { type: String, required: false, default: null },
    //     hbl_status: { type: String, required: false, default: null },
    //     hbl_issue_place: { type: String, required: false, default: null },
    //     m_vesselname_flightno_text: { type: String, required: false, default: null },
    //     m_voyno_flightdatetime_text: { type: String, required: false, default: null },
    //     hbl_type: { type: String, required: false, default: null },
    //     no_of_packages_text: { type: String, required: false, default: null },
    //     no_of_bl_text: { type: String, required: false, default: null },
    //     company_id: { type: Number, required: false, default: null },
    //     blFlag: { type: String, required: false, default: null },
    //     nominated_area_text: { type: String, required: false, default: null },
    //     memoType: { type: String, required: false, default: null },
    //     memoCategory: { type: String, required: false, default: null },
    //     shippingline_airline_agent_text: { type: String, required: false, default: null },
    //     shippingline_airline_text: { type: String, required: false, default: null },
    //     frtforwarder_id: { type: String, required: false, default: null },
    //     frtforwarder_text: { type: String, required: false, default: null },
    //     job_no: { type: String, required: false, default: null },
    //     blformat_id: { type: String, required: false, default: null },
    //     cont_wt_pk: { type: String, required: false, default: null },
    //     commodity: { type: String, required: false, default: null },
    //     container_details: { type: String, required: false, default: null },
    //     shippers_reference_no: { type: String, required: false, default: null },
    //     consignee_reference_no: { type: String, required: false, default: null },
    //     freight_forwarder_address: { type: String, required: false, default: null },
    //     freight_forwarder_pincode: { type: String, required: false, default: null },
    //     freight_forwarder_city: { type: String, required: false, default: null },
    //     freight_forwarder_state: { type: String, required: false, default: null },
    //     freight_forwarder_country: { type: String, required: false, default: null },
    //     country_of_origin: { type: String, required: false, default: null },
    //     clause_id: { type: Number, required: false, default: null },
    //     service_type: { type: String, required: false, default: null },
    //     terminal_id: { type: String, required: false, default: null },
    //     loosePackage: { type: String, required: false, default: null },
    //     loosePackage_unit_id: { type: String, required: false, default: null },
    //     sb_no_date: { type: String, required: false, default: null },
    //     imo_class: { type: String, required: false, default: null },
    //     imo_group: { type: String, required: false, default: null },
    //     imo_ems_no: { type: String, required: false, default: null },
    //     company_branch_id: { type: Number, required: false, default: null },
    //     mbl_id: { type: String, required: false, default: null },
    //     imo_desc: { type: String, required: false, default: null },
    //     unitOf: { type: String, required: false, default: null },
    //     transshipment: { type: String, required: false, default: null },
    //     yard_id: { type: String, required: false, default: null },
    //     IECode: { type: String, required: false, default: null },
    //     APCode: { type: String, required: false, default: null },
    //     concor_id: { type: String, required: false, default: null },
    //     sks_id: { type: String, required: false, default: null },
    //     typeof_bl: { type: Number, required: false, default: null },
    //     transaction_status: { type: String, required: false, default: null },
    //     blprint_charge_flag: { type: String, required: false, default: null },
    //     bl_gen_auto_num: { type: String, required: false, default: null },
    //     basic_freight_usd: { type: String, required: false, default: null },
    //     basic_freight_inr: { type: String, required: false, default: null },
    //     BAF_usd: { type: String, required: false, default: null },
    //     BAF_inr: { type: String, required: false, default: null },
    //     CAF_usd: { type: String, required: false, default: null },
    //     CAF_inr: { type: String, required: false, default: null },
    //     Freight_surcharge_usd: { type: String, required: false, default: null },
    //     Freight_surcharge_inr: { type: String, required: false, default: null },
    //     Freight_other_usd: { type: String, required: false, default: null },
    //     Freight_other_inr: { type: String, required: false, default: null },
    //     total_freight_usd: { type: String, required: false, default: null },
    //     total_freight_inr: { type: String, required: false, default: null },
    //     thc_inr: { type: String, required: false, default: null },
    //     doc_inr: { type: String, required: false, default: null },
    //     other_inr: { type: String, required: false, default: null },
    //     DO_inr: { type: String, required: false, default: null },
    //     DDC_inr: { type: String, required: false, default: null },
    //     DDC_USD: { type: String, required: false, default: null },
    //     bl_charge_inr: { type: String, required: false, default: null },
    //     service_tax_inr: { type: String, required: false, default: null },
    //     total_charges_inr: { type: String, required: false, default: null },
    //     exchange_rate: { type: String, required: false, default: null },
    //     repo_inr: { type: String, required: false, default: null },
    //     total_charges_inr_word: { type: String, required: false, default: null },
    //     container_nos: { type: String, required: false, default: null },
    //     marks_print: { type: String, required: false, default: null },
    //     container_details_print: { type: String, required: false, default: null },
    //     no_of_container_text: { type: String, required: false, default: null },
    //     CHABondNo: { type: String, required: false, default: null },
    //     consig_factory_loc: { type: String, required: false, default: null },
    //     desc_of_goods_print: { type: String, required: false, default: null },
    //     container_marks_print: { type: String, required: false, default: null },
    //     attachment_remarks: { type: String, required: false, default: null },
    //     clause_description: { type: String, required: false, default: null },
    //     is_deleted: { type: Number, required: false, default: null },
    //     do_no: { type: String, required: false, default: null },
    //     do_date: { type: String, required: false, default: null },
    //     sector_id: { type: String, required: false, default: null },
    //     last_vessel_id: { type: Number, required: false, default: null },
    //     last_vessel_text: { type: String, required: false, default: null },
    //     last_voy_id: { type: Number, required: false, default: null },
    //     last_voy_text: { type: String, required: false, default: null },
    //     free_days_origin: { type: Number, required: false, default: null },
    //     free_days_dest: { type: Number, required: false, default: null },
    //     Dem_rate_origin: { type: String, required: false, default: null },
    //     Dem_rate_dest: { type: String, required: false, default: null },
    //     freeDaysCurrency: { type: String, required: false, default: null },
    //     DemCurrency: { type: String, required: false, default: null },
    //     booked_through: { type: String, required: false, default: null },
    //     broker_Id: { type: String, required: false, default: null },
    //     brokerage: { type: String, required: false, default: null },
    //     brokerage_percentage: { type: String, required: false, default: null },
    //     pol_terminal: { type: Number, required: false, default: null },
    //     ship_Reference_Date: { type: String, required: false, default: null },
    //     commodity_id: { type: String, required: false, default: null },
    //     marine_pollutant: { type: String, required: false, default: null },
    //     page_type: { type: String, required: false, default: null },
    //     deleted_no: { type: String, required: false, default: null },
    //     M_BL: { type: String, required: false, default: null },
    //     H_BL: { type: String, required: false, default: null },
    //     financial_year_id: { type: Number, required: false, default: null },
    //     tare_wt: { type: String, required: false, default: null },
    //     tare_wt_unit: { type: String, required: false, default: null },
    //     old_id: { type: String, required: false, default: null },
    //     customer_bl_id: { type: String, required: false, default: null },
    //     hbl_nos: { type: String, required: false, default: null },
    //     mbl_nos: { type: String, required: false, default: null },
    //     deleted: { type: String, required: false, default: null },
    //     vessArrDate: { type: String, required: false, default: null },
    //     freePeriodStrtDate: { type: String, required: false, default: null },
    //     pod_broker_id: { type: String, required: false, default: null },
    //     bl_release_type: { type: String, required: false, default: null },
    //     bank: { type: String, required: false, default: null },
    //     document_type_id: { type: String, required: false, default: null },
    //     Commodity_type: { type: Number, required: false, default: null },
    //     HS_code: { type: String, required: false, default: null },
    //     proper_shipping_name: { type: String, required: false, default: null },
    //     subsidiary_risk: { type: String, required: false, default: null },
    //     flash_point_unit: { type: String, required: false, default: null },
    //     melting_point: { type: String, required: false, default: null },
    //     melting_point_unit: { type: String, required: false, default: null },
    //     heating_temp: { type: String, required: false, default: null },
    //     heating_temp_unit: { type: String, required: false, default: null },
    //     post_carriage: { type: String, required: false, default: null },
    //     is_coloader_data: { type: Number, required: false, default: 0 },
    //     business_type: { type: String, required: false, default: null },
    //     cas_no: { type: String, required: false, default: null },
    //     clause_desc: { type: String, required: false, default: null },
    //     specific_gravity: { type: String, required: false, default: null },
    //     page_code: { type: String, required: false, default: null },
    //     voucher_id: { type: String, required: false, default: null },
    //     marks_container_details: { type: String, required: false, default: null },
    //     item_type: { type: String, required: false, default: null },
    //     consignee_address1: { type: String, required: false, default: null },
    //     consignee_address2: { type: String, required: false, default: null },
    //     consignee_address3: { type: String, required: false, default: null },
    //     notifying_party1_add1: { type: String, required: false, default: null },
    //     notifying_party1_add2: { type: String, required: false, default: null },
    //     notifying_party1_add3: { type: String, required: false, default: null },
    //     concor_bond_no: { type: String, required: false, default: null },
    //     destination_edi_code: { type: String, required: false, default: null },
    //     concor_desc: { type: String, required: false, default: null },
    //     mode: { type: String, required: false, default: null },
    //     commodity_text: { type: String, required: false, default: null },
    //     new_igm_no: { type: String, required: false, default: null },
    //     new_igm_date: { type: String, required: false, default: null },
    //     new_line_no: { type: String, required: false, default: null },
    //     new_hbl_type: { type: String, required: false, default: null },
    //     mlo: { type: Number, required: false, default: null },
    //     slot_owner: { type: String, required: false, default: null },
    //     delivery_agent_branch: { type: Number, required: false, default: null },
    //     delivery_agent_branch_text: { type: String, required: false, default: null },
    //     pod_agent_address: { type: String, required: false, default: null },
    //     soc: { type: String, required: false, default: null },
    //     new_consignee_id: { type: String, required: false, default: null },
    //     sez: { type: String, required: false, default: null },
    //     hss: { type: String, required: false, default: null },
    //     surveyor_id: { type: String, required: false, default: null },
    //     factory_name: { type: String, required: false, default: null },
    //     container_charge_details: { type: String, required: false, default: null },
    //     GRent_free_days: { type: String, required: false, default: null },
    //     package_type_text: { type: String, required: false, default: null },
    //     load_port_agent_add: { type: String, required: false, default: null },
    //     bl_no: { type: Number, required: false, default: null },
    //     igm_remarks: { type: String, required: false, default: null },
    //     landing_date: { type: String, required: false, default: null },
    //     created_by_company_branch_id: { type: Number, required: false, default: null },
    //     created_by_company_id: { type: Number, required: false, default: null },
    //     bl_sl_no: { type: Number, required: false, default: null },
    //     shipping_bill_no: { type: String, required: false, default: null },
    //     chargeable_weight: { type: String, required: false, default: null },
    //     chargeable_weight_unit: { type: String, required: false, default: null },
    //     transhipment_agent: { type: String, required: false, default: null },
    //     transhipment_agent1: { type: String, required: false, default: null },
    //     Rotation_no: { type: String, required: false, default: null },
    //     arrival_date: { type: String, required: false, default: null },
    //     volume_weight: { type: String, required: false, default: null },
    //     sub_job_id: { type: Number, required: false, default: null },
    //     department_id: { type: Number, required: false, default: null },
    //     bl_type_id: { type: Number, required: false, default: null },
    //     bl_category_id: { type: Number, required: false, default: null },
    //     sailing_date: { type: String, required: false, default: null },
    //     new_item_type: { type: String, required: false, default: null },
    //     issuing_agent_id: { type: String, required: false, default: null },
    //     net_of_amt: { type: String, required: false, default: null },
    //     brokerage_paid: { type: String, required: false, default: null },
    //     parent_bl_id: { type: String, required: false, default: null },
    //     frt_approval_no: { type: String, required: false, default: null },
    //     pol_agent_branch: { type: Number, required: false, default: null },
    //     pod_agent_branch: { type: Number, required: false, default: null },
    //     convref: { type: String, required: false, default: null },
    //     containerwise_details_in_bl_print: { type: String, required: false, default: null },
    //     detention_id: { type: String, required: false, default: null },
    //     jumping_slab: { type: String, required: false, default: null },
    //     transit_time: { type: String, required: false, default: null },
    //     destination_depot_id: { type: String, required: false, default: null },
    //     destination_depot_address: { type: String, required: false, default: null },
    //     EDoc: { type: String, required: false, default: null },
    //     cheque_no: { type: String, required: false, default: null },
    //     cheque_date: { type: String, required: false, default: null },
    //     deposit_amount: { type: String, required: false, default: null },
    //     deposit_received_date: { type: String, required: false, default: null },
    //     bond_cancelled_date: { type: String, required: false, default: null },
    //     slab_count: { type: String, required: false, default: null },
    //     route_type_id: { type: Number, required: false, default: null },
    //     carrier_instruction: { type: String, required: false, default: null },
    //     dpd_code_id: { type: String, required: false, default: null },
    //     load_port_cha_branch: { type: String, required: false, default: null },
    //     surveyor_branch: { type: String, required: false, default: null },
    //     Rot_no: { type: String, required: false, default: null },
    //     slot_charge_paid_by: { type: String, required: false, default: null },
    //     switch_agent: { type: String, required: false, default: null },
    //     switch_bl: { type: String, required: false, default: null },
    //     switch_agent_branch: { type: String, required: false, default: null },
    //     consignee_nominated_cfs: { type: String, required: false, default: null },
    //     transhipment_agent_branch: { type: String, required: false, default: null },
    //     transhipment_agent1_branch: { type: String, required: false, default: null },
    //     plr_agent: { type: Number, required: false, default: null },
    //     plr_agent_branch: { type: Number, required: false, default: null },
    //     wt_bl_print: { type: String, required: false, default: null },
    //     origin_demurrage_free_days: { type: String, required: false, default: null },
    //     destination_demurrage_free_days: { type: String, required: false, default: null },
    //     pod_hs_code: { type: String, required: false, default: null },
    //     transhipment_discharge_vessel_id: { type: String, required: false, default: null },
    //     transhipment_discharge_voyage_id: { type: String, required: false, default: null },
    //     transhipment_load_vessel_id: { type: String, required: false, default: null },
    //     transhipment_load_voyage_id: { type: String, required: false, default: null },
    //     third_cfs_id: { type: String, required: false, default: null },
    //     do_valid_date: { type: String, required: false, default: null },
    //     bl_updated: { type: String, required: false, default: null },
    //     include_in_dsr: { type: String, required: false, default: null },
    //     BL_Nom_Status: { type: String, required: false, default: null },
    //     tranship_port2: { type: String, required: false, default: null },
    //     transhipment_agent2: { type: String, required: false, default: null },
    //     transhipment_agent2_branch: { type: String, required: false, default: null },
    //     transhipment2_load_vessel_id: { type: String, required: false, default: null },
    //     transhipment2_load_voyage_id: { type: String, required: false, default: null },
    //     sb_date: { type: String, required: false, default: null },
    //     shipper_id_no: { type: String, required: false, default: null },
    //     consignee_id_no: { type: String, required: false, default: null },
    //     notify_party1_id_no: { type: String, required: false, default: null },
    //     surrender_date: { type: String, required: false, default: null },
    //     trade_terms_id: { type: Number, required: false, default: null },
    //     new_consignee_address: { type: String, required: false, default: null },
    //     new_consignee_add: { type: String, required: false, default: null },
    //     email_to: { type: String, required: false, default: null },
    //     email_cc: { type: String, required: false, default: null },
    //     payment_coll_agent: { type: String, required: false, default: null },
    //     export_job_no: { type: String, required: false, default: null },
    //     import_job_no: { type: String, required: false, default: null },
    //     print_cbm: { type: String, required: false, default: null },

    //     tbl_bl_charge: {
    //         type: [{

    //             bl_charge_id: { type: Number },
    //             bl_id: { type: Number },
    //             charge_id: { type: Number },
    //             buying_rate: { type: Number },
    //             selling_rate: { type: Number },
    //             currency: { type: Number },
    //             size_id: { type: Number },
    //             type_id: { type: Number },
    //             unit: { type: Number },
    //             prepaid_collect: { type: Number },

    //         }], required: false, default: []
    //     },
    //     tbl_bl_clause: {
    //         type: [{
    //             bl_clause_id: { type: Number, required: true },
    //             clause_id: { type: Number, required: true },
    //             added_by: { type: Number, required: true },
    //             added_on: { type: String, required: true },
    //             updated_by: { type: Number, required: true },
    //             updated_on: { type: Number, required: true },
    //             is_deleted: { type: Number, required: true },
    //             deleted_no: { type: Number, required: true },
    //             deleted: { type: Number, required: true },
    //         }]

    //     },
    //     tbl_bl_container: {
    //         type: [{
    //             bl_container_id: { type: Number },
    //             container_no: { type: String },
    //             size: { type: Number },
    //             type: { type: Number },
    //             status: { type: Number },
    //             ce_seal_no: { type: Number },
    //             agent_seal_no: { type: String },
    //             no_of_packages: { type: Number },

    //             gross_wt: { type: Number },

    //             gross_wt_unit: { type: Number },

    //             net_wt: { type: Number },

    //             net_wt_unit: { type: Number },

    //             ref_temp: { type: Number },

    //             ref_temp_unit: { type: String },
    //             soc: { type: String },
    //             bay_location: { type: String },

    //             short_shipment: { type: String },

    //             added_by: { type: Number },

    //             added_on: { type: String },

    //             updated_by: { type: Number },
    //             updated_on: { type: String },
    //             isReefer: { type: Number },

    //             type_of_package: { type: Number },

    //             ref_no: { type: Number },

    //             ref_date: { type: String },

    //             imo_code: { type: String },

    //             is_deleted: { type: Number },

    //             cargo_type_id: { type: Number },
    //             cargo_type_desc: { type: String },

    //             do_valid_date: { type: String },

    //             cbm_value: { type: Number },

    //             yard: { type: Number },

    //             container_units: { type: Number },

    //             offhire: { type: Number },

    //             slot_id: { type: Number },

    //             tare_wt: { type: Number },

    //             tare_wt_unit: { type: Number },

    //             deleted_no: { type: Number },
    //             CFS_in_date: { type: String },

    //             dock_destuff_date: { type: String },
    //             CFS_out_date: { type: String },

    //             empty_yard_in_date: { type: String },

    //             DMG_Charges: { type: Number },

    //             DMG_Collected: { type: Number },

    //             Bond_No: { type: String },

    //             Bond_Status: { type: Number },

    //             empLetterDate: { type: String },

    //             old_bl_id: { type: Number },

    //             old_container_id: { type: Number },

    //             seal_no_2: { type: Number },

    //             seal_no_3: { type: Number },

    //             seal_no_4: { type: Number },

    //             first_do_issue_date: { type: String },

    //             deposit_amount: { type: Number },

    //             validity_date: { type: String },

    //             bond_cancelled: { type: Number },

    //             bond_cancelled_date: { type: String },

    //             vessel_id: { type: Number },

    //             voyage_id: { type: Number },

    //             deleted: { type: Number },

    //             temp: { type: Number },

    //             temp_unit: { type: Number },

    //             odc_length: { type: Number },

    //             odc_width: { type: Number },

    //             odc_height: { type: Number },

    //             odc_unit: { type: Number },

    //             seal_no_5: { type: Number },

    //             arrival_date: { type: String },

    //             iso_code: { type: String },

    //             container_agent_code: { type: String },

    //             container_id: { type: Number },
    //             imo_class: { type: String },

    //             capacity: { type: Number },

    //             next_test_due: { type: String },

    //             loading_ref: { type: String },

    //             shutout: { type: String },

    //             commodity_type_id: { type: Number },

    //             free_days: { type: Number },

    //             size_type: { type: Number },

    //             odc: { type: String },
    //             slab_count: { type: Number },
    //             slot_owner: { type: String },
    //             transshipment_feeder_opr: { type: Number },
    //             slot_payable_by: { type: Number },
    //             transshipment_feeder_opr1: { type: String },
    //             transshipment_feeder_opr2: { type: String },
    //             cleaning_type: { type: String },
    //             seal_type: { type: Number },
    //             sb_no: { type: String },
    //             vgm: { type: String }


    //         }], required: false, default: []
    //     },


    // }),
   
    any:new mongoose.Schema({}, { strict: false }),

    tbl_voucher_ledger: new mongoose.Schema({

        voucher_ledger_id: { type: Number, required: false, default: null },
        voucher_id: { type: Number, required: false, default: null },
        Voucher_ref_id: { type: mongoose.Schema.Types.ObjectId,ref: "tbl_voucher" ,required: false, default: null },
        gl_account: { type: Number, required: false, default: null },
        Debit_Amount: { type: Number, required: false, default: null },
        Credit_Amount: { type: Number, required: false, default: null },
        is_deleted: { type: Number, required: false, default: null },
        debit_amount_fc: { type: Number, required: false, default: null },
        credit_amount_fc: { type: Number, required: false, default: null },
    }),

    formcontrol: new mongoose.Schema({

        dataentry_id: { type: Number, required: false, default: null },
        template_name: { type: String, required: false, default: null },
        module_template_id: { type: Number, required: false, default: null },
        tablename: { type: String, required: false, default: null },
        tabledescription: { type: String, required: false, default: null },
        user_id: { type: Number, required: false, default: null },

        sno: { type: Number, required: false, default: null },

        fieldname: { type: String, required: false, default: null },
        yourlabel: { type: String, required: false, default: null },

        controlname: { type: String, required: false, default: null },
        flag: { type: String, required: false, default: null },
        datatype: { type: String, required: false, default: null },


        fieldsize: { type: Number, required: false, default: null },



        fieldcompulsory: { type: String, required: false, default: null },

        Defaultvalue: { type: String, required: false, default: null },



        readonlyeditable: { type: String, required: false, default: null },

        dependenttable: { type: String, required: false, default: null },

        dependentcol1: { type: String, required: false, default: null },


        dependentcol2: { type: String, required: false, default: null },

        search: { type: String, required: false, default: null },


        String: { type: String, required: false, default: null },

        repeat_prev_value: { type: String, required: false, default: null },

        parenttable: { type: String, required: false, default: null },

        parent_id: { type: String, required: false, default: null },

        child_table: { type: String, required: false, default: null },

        display_parent_column: { type: String, required: false, default: null },

        tbl_primary_key: { type: String, required: false, default: null },

        added_by: { type: Number, required: false, default: null },

        page_type_multicolumn_single_grid: { type: String, required: false, default: null },

        dependent_column: { type: String, required: false, default: null },

        company: { type: String, required: false, default: null },

        related_column: { type: String, required: false, default: null },

        related_view: { type: String, required: false, default: null },

        validatorflag: { type: String, required: false, default: null },

        validationtype: { type: String, required: false, default: null },

        MasterFlag: { type: String, required: false, default: null },

        OrderByField: { type: String, required: false, default: null },

        runtimeFillFlag: { type: String, required: false, default: null },

        dotFlag: { type: String, required: false, default: null },

        onChangeFunction: { type: String, required: false, default: null },

        radiobuttontext: { type: String, required: false, default: null },

        radiobuttonvalue: { type: String, required: false, default: null },

        onBlurFunction: { type: String, required: false, default: null },

        onKeyPressFunction: { type: String, required: false, default: null },

        onFocusFunction: { type: String, required: false, default: null },

        Width: { type: Number, required: false, default: null },

        Height: { type: Number, required: false, default: null },

        display_Type: { type: String, required: false, default: null },

        textalign: { type: String, required: false, default: null },

        add_new: { type: String, required: false, default: null },

        addTo: { type: String, required: false, default: null },

        Page_Mode: { type: String, required: false, default: null },

        add_to_analysis: { type: String, required: false, default: null },

        alternate_field: { type: String, required: false, default: null },

        show_grid: { type: String, required: false, default: null },

        mst_cleanup_tablename: { type: String, required: false, default: null },

        costcenter_column_srno: { type: String, required: false, default: null },

        control_display_type: { type: String, required: false, default: null },

        dsr_module_template_id: { type: String, required: false, default: null },

        is_deleted: { type: String, required: false, default: null },

        add_to_filter: { type: String, required: false, default: null },

        audit_in_add: { type: Number, required: false, default: 0 },

        parent_dataentry_id: { type: Number, required: false, default: null },

        row_no: { type: Number, required: false, default: null },

        row_header: { type: String, required: false, default: null },

        audit_in_edit: { type: Number, required: false, default: 0 },

        where_condition: { type: String, required: false, default: null },

        filter_dataentry_id: { type: Number, required: false, default: null },

        toolTip: { type: String, required: false, default: null },

        updated_by: { type: Number, required: false, default: null },

        updated_on: { type: String, required: false, default: null },

        deleted_no: { type: Number, required: false, default: null },

        delted_no: { type: Number, required: false, default: null },

        default_view: { type: String, required: false, default: null },

        default_column: { type: String, required: false, default: null },

        delete_no: { type: Number, required: false, default: null },

        section_header: { type: String, required: false, default: null },

        section_header_sequence: { type: Number, required: false, default: null },

        deleted: { type: String, required: false, default: null },

        mst_cleanup_primarykey: { type: String, required: false, default: null },

        paging_for_dropdown: { type: String, required: false, default: null },

        fire_onblur: { type: String, required: false, default: null },

        show_pop_up: { type: String, required: false, default: null },

        tooltip_store: { type: String, required: false, default: null },

        dyn_report_view_name: { type: String, required: false, default: null },


        Terminal: { type: String, required: false, default: null },

    }),

   

//   FieldSchema : new mongoose.Schema({
//     fieldname: String,
//     value: String, // Mixed type for dynamic content
//     yourlabel: String,
//     controlname: String,
//     flag: String,
//     Width: Number,
//     Height: Number,
//     display_Type: String,
//   textalign: String,
//   add_new: String,
//   addTo: String,
//   Page_Mode: String,
//   add_to_analysis: String,
//   alternate_field: String,
//   show_grid: String,
//   mst_cleanup_tablename: String,
//   costcenter_column_srno: String,
//   control_display_type: String,
//   dsr_module_template_id: String,
//   is_deleted: String,
//   add_to_filter: String,
//   audit_in_add: Number,
//   parent_dataentry_id: Number,
//   row_no: Number,
//   row_header: String,
//   audit_in_edit: Number,
//   where_condition: String,
//   filter_dataentry_id: Number,
//   toolTip: String,
//   updated_by: Number,
//   updated_on: String,
//   deleted_no: Number,
//   delted_no: Number,
//   default_view: String,
//   default_column: String,
//   delete_no: Number,
//   section_header: String,
//   section_header_sequence: Number,
//   deleted: String,
//   mst_cleanup_primarykey: String,
//   paging_for_dropdown: String,
//   fire_onblur: String,
//   show_pop_up: String,
//   tooltip_store: String,
//   dyn_report_view_name: String,
//   Terminal: String
 

//}),

//  childTableSchema :new mongoose.Schema({
//   table_name: String,
//   fields: [FieldSchema] 
// }),

 mainTableSchema : new mongoose.Schema({
  table_name: String,
  fields: [{
    fieldname: String,
    value: String, // Mixed type for dynamic content
    yourlabel: String,
    controlname: String,
    flag: String,
    Width: Number,
    Height: Number,
    display_Type: String,
    

  }], 
  children: [
    { 
    table_name: String,
    fields:[{
        fieldname: String,
        value: [String], // Mixed type for dynamic content
        yourlabel: String,
        controlname: String,
        flag: String,
        Width: Number,
        Height: Number,
        display_Type: String, 
    }]
    }], // Array of child tables
  user_id: Number,
  ordering: Number
}),


master_schema: new mongoose.Schema({
  id:{type:Number, required:true, default:0},
  table_name: {type:String, required:false, default:null},
  fields: [{
    fieldname: String,
    default_value:mongoose.Schema.Types.Mixed,
    status:{type:Number, required:false, default:1},
    isrequired:Boolean,
    fk:String,
    reference_table: String,
    //teble_name:String,
    company_table:String,

  }],
  children: [{
    table_name: String,
    fields: [{
      fieldname: String,
      default_value:mongoose.Schema.Types.Mixed,
      status:{type:Number, required:false, default:1},
      isrequired:Boolean
    }]
  }], // Array of child tables
  status:{type:Number, required:false, default:1},
  add_dt:{type:Date,required:false, default:Date.now()},
  updated_dt:{type:Date,required:false, default:Date.now()}, 
  add_by:{type:Number,required:false, default:null},
  updated_by:{type:Number,required:false, default:null},
  
}),

tbl_jay: new mongoose.Schema({
  id:{type:Number, required:true, default:0},
  table_name: {type:String, required:false, default:null},
  fields: [{
    fieldname: String,
    default_value:mongoose.Schema.Types.Mixed,
    status:{type:Number, required:false, default:1},
    isrequired:Boolean,
    fk:String,
    reference_table: String,
    company_table:String,

  }],
  children: [{
    table_name: String,
    fields: [{
      fieldname: String,
      default_value:mongoose.Schema.Types.Mixed,
      status:{type:Number, required:false, default:1},
      isrequired:Boolean
    }]
  }], // Array of child tables
  status:{type:Number, required:false, default:1},
  add_dt:{type:Date,required:false, default:Date.now()},
  updated_dt:{type:Date,required:false, default:Date.now()}, 
  add_by:{type:Number,required:false, default:null},
  updated_by:{type:Number,required:false, default:null},
  
}),





 //MainTable: mongoose.model('MainTable', mainTableSchema)



}



