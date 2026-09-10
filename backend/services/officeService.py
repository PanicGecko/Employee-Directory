from datetime import datetime

from fastapi import HTTPException, status

from dto.officeDto import OfficeCreateRequest, OfficeResponse, OfficeUpdateRequest
from models.office import Office
from repos.employeeRepo import has_employees_in_office
from repos.officeRepo import (
    create_office,
    get_office_by_id,
    list_active_offices,
    list_offices,
    update_office,
)
from services.auditService import record_audit_log


def list_offices_service(session) -> list[OfficeResponse]:
    offices = list_offices(session=session)

    return [
        OfficeResponse(
            id=office.id,
            name=office.name,
            street_address=office.street_address,
            city=office.city,
            state=office.state,
            zip_code=office.zip_code,
            country=office.country,
            is_active=office.is_active,
            created_at=office.created_at,
            updated_at=office.updated_at,
        )
        for office in offices
    ]


def list_active_offices_service(session) -> list[OfficeResponse]:
    offices = list_active_offices(session=session)

    return [
        OfficeResponse(
            id=office.id,
            name=office.name,
            street_address=office.street_address,
            city=office.city,
            state=office.state,
            zip_code=office.zip_code,
            country=office.country,
            is_active=office.is_active,
            created_at=office.created_at,
            updated_at=office.updated_at,
        )
        for office in offices
    ]


def create_office_service(
    session,
    office_data: OfficeCreateRequest,
    actor_employee_id: int,
) -> OfficeResponse:
    normalized_name = office_data.name.strip()

    if not normalized_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Office name is required",
        )

    office = Office(
        name=normalized_name,
        street_address=office_data.street_address.strip(),
        city=office_data.city.strip(),
        state=office_data.state.strip() if office_data.state else None,
        zip_code=office_data.zip_code.strip() if office_data.zip_code else None,
        country=office_data.country.strip(),
    )

    created_office = create_office(session=session, office=office)
    record_audit_log(
        session=session,
        actor_employee_id=actor_employee_id,
        target_type="office",
        target_id=created_office.id,
        action="create",
        new_values={
            "name": created_office.name,
            "street_address": created_office.street_address,
            "city": created_office.city,
            "state": created_office.state,
            "zip_code": created_office.zip_code,
            "country": created_office.country,
            "is_active": created_office.is_active,
        },
    )
    session.commit()

    return OfficeResponse(
        id=created_office.id,
        name=created_office.name,
        street_address=created_office.street_address,
        city=created_office.city,
        state=created_office.state,
        zip_code=created_office.zip_code,
        country=created_office.country,
        is_active=created_office.is_active,
        created_at=created_office.created_at,
        updated_at=created_office.updated_at,
    )


def update_office_service(
    session,
    office_id: int,
    office_data: OfficeUpdateRequest,
    actor_employee_id: int,
) -> OfficeResponse:
    if all(
        v is None
        for v in [
            office_data.name,
            office_data.street_address,
            office_data.city,
            office_data.state,
            office_data.zip_code,
            office_data.country,
        ]
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field must be provided for update",
        )

    office = get_office_by_id(session=session, office_id=office_id)
    if office is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Office not found",
        )

    original_values = {
        "name": office.name,
        "street_address": office.street_address,
        "city": office.city,
        "state": office.state,
        "zip_code": office.zip_code,
        "country": office.country,
    }

    if office_data.name is not None:
        new_name = office_data.name.strip()
        if not new_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Office name is required",
            )
        office.name = new_name

    if office_data.street_address is not None:
        office.street_address = office_data.street_address.strip()

    if office_data.city is not None:
        office.city = office_data.city.strip()

    if office_data.state is not None:
        office.state = office_data.state.strip() or None

    if office_data.zip_code is not None:
        office.zip_code = office_data.zip_code.strip() or None

    if office_data.country is not None:
        office.country = office_data.country.strip()

    if (
        office.name == original_values["name"]
        and office.street_address == original_values["street_address"]
        and office.city == original_values["city"]
        and office.state == original_values["state"]
        and office.zip_code == original_values["zip_code"]
        and office.country == original_values["country"]
    ):
        return OfficeResponse(
            id=office.id,
            name=office.name,
            street_address=office.street_address,
            city=office.city,
            state=office.state,
            zip_code=office.zip_code,
            country=office.country,
            is_active=office.is_active,
            created_at=office.created_at,
            updated_at=office.updated_at,
        )

    office.updated_at = datetime.utcnow()

    updated_office = update_office(session=session, office=office)
    record_audit_log(
        session=session,
        actor_employee_id=actor_employee_id,
        target_type="office",
        target_id=updated_office.id,
        action="update",
        old_values=original_values,
        new_values={
            "name": updated_office.name,
            "street_address": updated_office.street_address,
            "city": updated_office.city,
            "state": updated_office.state,
            "zip_code": updated_office.zip_code,
            "country": updated_office.country,
        },
    )
    session.commit()

    return OfficeResponse(
        id=updated_office.id,
        name=updated_office.name,
        street_address=updated_office.street_address,
        city=updated_office.city,
        state=updated_office.state,
        zip_code=updated_office.zip_code,
        country=updated_office.country,
        is_active=updated_office.is_active,
        created_at=updated_office.created_at,
        updated_at=updated_office.updated_at,
    )


def delete_office_service(
    session,
    office_id: int,
    actor_employee_id: int,
) -> OfficeResponse:
    office = get_office_by_id(session=session, office_id=office_id)
    if office is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Office not found",
        )

    if has_employees_in_office(session=session, office_id=office_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Office is assigned to employees and cannot be deleted",
        )

    office.is_active = False
    office.updated_at = datetime.utcnow()

    deactivated_office = update_office(session=session, office=office)
    record_audit_log(
        session=session,
        actor_employee_id=actor_employee_id,
        target_type="office",
        target_id=deactivated_office.id,
        action="delete",
        old_values={
            "name": deactivated_office.name,
            "street_address": deactivated_office.street_address,
            "city": deactivated_office.city,
            "state": deactivated_office.state,
            "zip_code": deactivated_office.zip_code,
            "country": deactivated_office.country,
            "is_active": True,
        },
        new_values={
            "name": deactivated_office.name,
            "street_address": deactivated_office.street_address,
            "city": deactivated_office.city,
            "state": deactivated_office.state,
            "zip_code": deactivated_office.zip_code,
            "country": deactivated_office.country,
            "is_active": deactivated_office.is_active,
        },
    )
    session.commit()

    return OfficeResponse(
        id=deactivated_office.id,
        name=deactivated_office.name,
        street_address=deactivated_office.street_address,
        city=deactivated_office.city,
        state=deactivated_office.state,
        zip_code=deactivated_office.zip_code,
        country=deactivated_office.country,
        is_active=deactivated_office.is_active,
        created_at=deactivated_office.created_at,
        updated_at=deactivated_office.updated_at,
    )


def reactivate_office_service(
    session,
    office_id: int,
    actor_employee_id: int,
) -> OfficeResponse:
    office = get_office_by_id(session=session, office_id=office_id)
    if office is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Office not found",
        )

    if office.is_active:
        return OfficeResponse(
            id=office.id,
            name=office.name,
            street_address=office.street_address,
            city=office.city,
            state=office.state,
            zip_code=office.zip_code,
            country=office.country,
            is_active=office.is_active,
            created_at=office.created_at,
            updated_at=office.updated_at,
        )

    office.is_active = True
    office.updated_at = datetime.utcnow()

    reactivated_office = update_office(session=session, office=office)
    record_audit_log(
        session=session,
        actor_employee_id=actor_employee_id,
        target_type="office",
        target_id=reactivated_office.id,
        action="reactivate",
        old_values={"is_active": False},
        new_values={"is_active": reactivated_office.is_active},
    )
    session.commit()

    return OfficeResponse(
        id=reactivated_office.id,
        name=reactivated_office.name,
        street_address=reactivated_office.street_address,
        city=reactivated_office.city,
        state=reactivated_office.state,
        zip_code=reactivated_office.zip_code,
        country=reactivated_office.country,
        is_active=reactivated_office.is_active,
        created_at=reactivated_office.created_at,
        updated_at=reactivated_office.updated_at,
    )
